"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import type { Card } from "ts-fsrs";
import {
	deadlines,
	events,
	folders,
	questions,
	tableUploads,
	uploads,
} from "@/drizzle/schema";
import {
	generateQuestions,
	generateWrongOptions,
} from "@/src/lib/ai/question-generator";
import { auth } from "@/src/lib/auth";
import {
	getQuestionImagePublicUrl,
	removePdf,
	uploadPdf,
	uploadQuestionImage,
} from "@/src/lib/storage";
import { isParsedTableData, parseXlsxTable } from "@/src/lib/xlsx-table";
import type {
	DeleteItemName,
	databaseDelete,
	EventInsert,
	ParentUpdateColumn,
	ParentUpdateTable,
	StudyQuestion,
	TextUpdateColumn,
	TextUpdateTable,
} from "@/src/types";
import { db } from "./index";

const DISPLAY_ORDER_STEP = 100;
type ReorderQuestion = Pick<StudyQuestion, "id" | "displayOrder" | "upload_id">;
type OwnedTable =
	| "questions"
	| "uploads"
	| "folders"
	| "tableUploads"
	| "table_uploads"
	| "deadlines";
const ownedTables = {
	uploads: [uploads, uploads.id, uploads.userId],
	folders: [folders, folders.id, folders.userId],
	tableUploads: [tableUploads, tableUploads.id, tableUploads.userId],
	table_uploads: [tableUploads, tableUploads.id, tableUploads.userId],
	deadlines: [deadlines, deadlines.id, deadlines.userId],
} as const;
async function getSessionUserId() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) throw new Error("Not authenticated");
	return session.user.id;
}
async function assertOwned(table: OwnedTable, id: string, userId: string) {
	if (table === "questions") {
		const result = await db.execute<{ upload_id: string }>(sql`
			select ${questions.uploadId} from ${questions}
			join ${uploads} on ${questions.uploadId} = ${uploads.id}
			where ${questions.id} = ${id} and ${uploads.userId} = ${userId} limit 1
		`);
		if (!result.rows[0]) throw new Error("Not authorized");
		return result.rows[0].upload_id;
	}
	const [target, idColumn, userColumn] = ownedTables[table];
	const result = await db.execute(
		sql`select 1 from ${target} where ${idColumn} = ${id} and ${userColumn} = ${userId} limit 1`,
	);
	if (!result.rows[0]) throw new Error("Not authorized");
}
async function removePdfOrThrow(path: string) {
	const { error } = await removePdf(path);
	if (error) throw new Error("Failed to delete PDF from storage");
}
function displayOrder(prev?: number | null, next?: number | null) {
	if (prev == null) return Math.floor((next ?? DISPLAY_ORDER_STEP) / 2);
	return next == null
		? prev + DISPLAY_ORDER_STEP
		: Math.floor((prev + next) / 2);
}
async function normalizeOrder(uploadId: string) {
	await db.execute(
		sql`select normalize_question_display_order(${uploadId}::uuid)`,
	);
}
export async function normalizeQuestionDisplayOrder(uploadId: string) {
	await assertOwned("uploads", uploadId, await getSessionUserId());
	await normalizeOrder(uploadId);
}
export async function generateWrongOptionsAction(
	question: string,
	answer: string,
	questionId: string,
) {
	const uploadId = await assertOwned(
		"questions",
		questionId,
		await getSessionUserId(),
	);
	const options = await generateWrongOptions(question, answer);
	await db
		.update(questions)
		.set({ options })
		.where(eq(questions.id, questionId));
	for (const path of ["uploads", "quiz", "study"])
		revalidatePath(`/${path}/${uploadId}`);
	return options;
}
export async function uploadAndGenerateAction(formData: FormData) {
	const file = formData.get("pdf");
	if (!(file instanceof File) || !file.size) throw new Error("No PDF provided");
	if (file.type !== "application/pdf") throw new Error("Only PDFs supported");
	const pdfBuffer = Buffer.from(await file.arrayBuffer());
	const upload = await createUpload(file);
	after(async () => {
		try {
			await generateQuestions(pdfBuffer, upload.id);
			await db
				.update(uploads)
				.set({ status: "completed" })
				.where(eq(uploads.id, upload.id));

			revalidatePath(`/uploads/${upload.id}`);
		} catch (error) {
			console.error("Background question generation error:", error);
			await db
				.update(uploads)
				.set({ status: "failed" })
				.where(eq(uploads.id, upload.id));
		}
	});
	revalidatePath("/");
	return { uploadId: upload.id };
}
export async function uploadTableAction(formData: FormData) {
	const file = formData.get("xlsx");
	if (!(file instanceof File) || !file.size)
		throw new Error("No XLSX provided");
	if (
		!file.name.toLowerCase().endsWith(".xlsx") &&
		file.type !==
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	)
		throw new Error("Only XLSX files supported");
	const [upload] = await db
		.insert(tableUploads)
		.values({
			filename: file.name,
			parsedData: parseXlsxTable(await file.arrayBuffer()),
			userId: await getSessionUserId(),
		})
		.returning({ id: tableUploads.id });
	revalidatePath("/");
	return { tableUploadId: upload.id };
}
export async function createUpload(source: File | string) {
	const userId = await getSessionUserId();
	const file = source instanceof File ? source : null;
	const filename = typeof source === "string" ? source : source.name;
	const storagePath = file
		? `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
		: null;
	if (file && storagePath) {
		const { error } = await uploadPdf(storagePath, file);
		if (error) throw new Error("Failed to save PDF to storage");
	}
	try {
		const [upload] = await db
			.insert(uploads)
			.values({
				filename,
				status: file ? "processing" : "completed",
				storagePath,
				userId,
			})
			.returning();
		return upload;
	} catch (error) {
		if (storagePath) await removePdfOrThrow(storagePath);
		throw error;
	}
}
export async function deleteItemAction(id: string, variant: databaseDelete) {
	//TODO CONSOLIDATE BELOW
	try {
		await db.delete(variant).where(eq(variant.id, id));
		revalidatePath("/");
	} catch (error) {
		console.error("Delete error:", error);
		throw new Error(`Failed to delete ${variant}`);
	}
}
export async function deleteItemByNameAction(
	id: string,
	variant: DeleteItemName,
) {
	await assertOwned(variant, id, await getSessionUserId());
	await deleteItemAction(
		id,
		{ table_uploads: tableUploads, questions, folders, uploads }[variant],
	);
}
export async function updateQuestionTextAction<T extends TextUpdateTable>(
	id: string,
	text: string,
	table: T,
	columnName: TextUpdateColumn<T>,
) {
	const uploadId = await assertOwned(table, id, await getSessionUserId());
	switch (table) {
		case "questions": {
			if (columnName !== "questionText" && columnName !== "answerText") {
				throw new Error("Invalid question column");
			}

			const values =
				columnName === "questionText"
					? { questionText: text }
					: { answerText: text };

			await db.update(questions).set(values).where(eq(questions.id, id));
			break;
		}

		case "uploads": {
			if (columnName !== "filename" && columnName !== "description") {
				throw new Error("Invalid upload column");
			}

			const values =
				columnName === "filename" ? { filename: text } : { description: text };

			await db.update(uploads).set(values).where(eq(uploads.id, id));
			break;
		}

		case "folders":
			if (columnName !== "name") throw new Error("Invalid folder column");

			await db.update(folders).set({ name: text }).where(eq(folders.id, id));
			break;

		case "deadlines":
			if (columnName !== "title") throw new Error("Invalid deadline column");

			await db
				.update(deadlines)
				.set({ title: text })
				.where(eq(deadlines.id, Number(id)));
			break;
	}

	revalidatePath(
		uploadId
			? `/uploads/${uploadId}`
			: table === "uploads"
				? `/uploads/${id}`
				: "/",
	);
}
export async function updateTableCellAction(
	tableId: string,
	rowIndex: number,
	header: string,
	value: string,
) {
	const userId = await getSessionUserId();
	await assertOwned("tableUploads", tableId, userId);
	const [data] = await db
		.select({ parsedData: tableUploads.parsedData })
		.from(tableUploads)
		.where(eq(tableUploads.id, tableId))
		.limit(1);
	if (!data || !isParsedTableData(data.parsedData))
		throw new Error("Invalid table data");
	const row = data.parsedData.rows[rowIndex];
	if (!row || !(header in row)) throw new Error("Invalid cell");
	const nextTable = {
		headers: data.parsedData.headers,
		rows: data.parsedData.rows.map((item, index) =>
			index === rowIndex ? { ...item, [header]: value } : item,
		),
	};
	await db
		.update(tableUploads)
		.set({ parsedData: nextTable })
		.where(eq(tableUploads.id, tableId));
	revalidatePath(`/table_uploads/${tableId}`);
}
export async function uploadImageAction(
	questionId: string,
	formData: FormData,
) {
	const file = formData.get("file");
	if (!(file instanceof File)) return;
	const uploadId = await assertOwned(
		"questions",
		questionId,
		await getSessionUserId(),
	);
	const filePath = `question-images/${questionId}_${Date.now()}.${file.name.split(".").pop()}`;
	const { error } = await uploadQuestionImage(filePath, file);
	if (error) throw new Error("Failed to upload image");
	await db
		.update(questions)
		.set({ imageUrl: await getQuestionImagePublicUrl(filePath) })
		.where(eq(questions.id, questionId));
	revalidatePath(`/uploads/${uploadId}`, "page");
}
export async function addQuestionAction(
	//TODO remove sparse ordering
	uploadId: string,
	_insertAtPosition: number,
	prev?: number | null,
	next?: number | null,
) {
	await assertOwned("uploads", uploadId, await getSessionUserId());
	const order = displayOrder(prev, next);
	const now = new Date().toISOString();
	await db.insert(questions).values({
		uploadId,
		questionText: "Untitled Question",
		originalQuestionText: "User Added Question",
		answerText: "Untitled Answer",
		originalAnswerText: "Untitled Answer",
		fsrsDifficulty: 0,
		fsrsStability: 0,
		fsrsDueAt: now,
		fsrsLastReviewedAt: now,
		fsrsReviewCount: 0,
		fsrsState: 0,
		fsrsScheduled: 0,
		displayOrder: order,
	});
	revalidatePath(`/uploads/${uploadId}`);
	if (prev != null && next != null && order === prev + 1)
		after(async () => {
			await normalizeOrder(uploadId);
			revalidatePath(`/uploads/${uploadId}`);
		});
}
export async function addTelemetry(telemetry: EventInsert) {
	await assertOwned(
		"questions",
		telemetry.questionId,
		await getSessionUserId(),
	);
	await db.insert(events).values(telemetry);
}
export async function addFolderAction() {
	const [folder] = await db
		.insert(folders)
		.values({ name: "Untitled Folder", userId: await getSessionUserId() })
		.returning();
	revalidatePath("/");
	return folder;
}
function deadlineDate(value: string | null) {
	//TODO convert this to date
	if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value))
		throw new Error("Invalid due date");
	return value;
}
export async function addDeadlineAction(dueDate: string | null) {
	const [deadline] = await db
		.insert(deadlines)
		.values({
			title: "Untitled",
			dueDate: deadlineDate(dueDate),
			userId: await getSessionUserId(),
		})
		.returning({
			id: deadlines.id,
			created_at: deadlines.createdAt,
			due_date: deadlines.dueDate,
			title: deadlines.title,
			user_id: deadlines.userId,
		});
	revalidatePath("/");
	return deadline;
}
async function changeDeadline(
	//TODO MERGE TEHSE
	id: number,
	operation: "delete" | { title: string } | { dueDate: string | null },
) {
	const userId = await getSessionUserId();
	await assertOwned("deadlines", String(id), userId);
	if (operation === "delete")
		await db.delete(deadlines).where(eq(deadlines.id, id));
	else await db.update(deadlines).set(operation).where(eq(deadlines.id, id));
	revalidatePath("/");
}
export async function updateDeadlineDueDateAction(
	id: number,
	value: string | null,
) {
	await changeDeadline(id, { dueDate: deadlineDate(value) });
}
export async function updateDeadlineTitleAction(id: number, title: string) {
	await changeDeadline(id, { title });
}
export async function deleteDeadlineAction(id: number) {
	await changeDeadline(id, "delete");
}
export async function updateParentAction<T extends ParentUpdateTable>(
	id: string,
	parentId: string | null,
	table: T,
	columnName: ParentUpdateColumn<T>,
) {
	const userId = await getSessionUserId();
	await assertOwned(table, id, userId);
	if (parentId) await assertOwned("folders", parentId, userId);
	switch (table) {
		case "uploads":
			await db
				.update(uploads)
				.set({ folderId: parentId })
				.where(eq(uploads.id, id));
			break;

		case "tableUploads":
			await db
				.update(tableUploads)
				.set({ folderId: parentId })
				.where(eq(tableUploads.id, id));
			break;

		case "folders":
			await db.update(folders).set({ parentId }).where(eq(folders.id, id));
			break;
	}
	revalidatePath("/");
}
export async function updateFsrsAction(id: string, card: Card) {
	await assertOwned("questions", id, await getSessionUserId());
	await db
		.update(questions)
		.set({
			fsrsDifficulty: card.difficulty,
			fsrsDueAt: card.due.toISOString(),
			fsrsLapses: card.lapses,
			fsrsLastReviewedAt:
				card.last_review?.toISOString() ?? new Date().toISOString(),
			fsrsLearning: card.learning_steps,
			fsrsReviewCount: card.reps,
			fsrsScheduled: card.scheduled_days,
			fsrsStability: card.stability,
			fsrsState: card.state,
		})
		.where(eq(questions.id, id));
	revalidatePath("/study");
}
export async function reorderQuestionsAction(
	activeId: string,
	items: ReorderQuestion[],
) {
	const index = items.findIndex(({ id }) => id === activeId);
	if (index < 0) throw new Error("Question not found");
	const active = items[index];
	const uploadId = await assertOwned(
		"questions",
		activeId,
		await getSessionUserId(),
	);
	if (active.upload_id !== uploadId) throw new Error("Invalid upload");
	const prev = items[index - 1];
	const next = items[index + 1];
	let order = displayOrder(prev?.displayOrder, next?.displayOrder);
	if (prev && next && order === prev.displayOrder + 1) {
		await normalizeOrder(uploadId);
		const neighbors = await db
			.select({ id: questions.id, order: questions.displayOrder })
			.from(questions)
			.where(
				and(
					eq(questions.uploadId, uploadId),
					inArray(questions.id, [prev.id, next.id]),
				),
			);
		order = displayOrder(
			neighbors.find(({ id }) => id === prev.id)?.order,
			neighbors.find(({ id }) => id === next.id)?.order,
		);
	}
	await db
		.update(questions)
		.set({ displayOrder: order })
		.where(eq(questions.id, activeId));
	revalidatePath(`/uploads/${uploadId}`);
}
