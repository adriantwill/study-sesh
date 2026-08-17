"use server";
import { and, eq, inArray, sql } from "drizzle-orm";
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
	removeFile,
	uploadPdf,
	uploadQuestionImage,
} from "@/src/lib/storage";
import { isParsedTableData, parseXlsxTable } from "@/src/lib/xlsx-table";
import type {
	DeleteItemName,
	EventInsert,
	ParentTable,
	ReorderQuestion,
	Temp,
} from "@/src/types";
import { db } from "./index";

const DISPLAY_ORDER_STEP = 100;
async function getSessionUserId() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) throw new Error("Not authenticated");
	return session.user.id;
}
const column_to_table = {
	questionText: questions,
	answerText: questions,
	filename: uploads,
	description: uploads,
	name: folders,
	title: deadlines,
} as const;
export type TextUpdateColumn = keyof typeof column_to_table;
const string_to_table = {
	table_uploads: tableUploads,
	questions,
	folders,
	uploads,
};
async function assertOwned(table: Temp, id: string, userId: string) {
	switch (table) {
		case questions: {
			const [result] = await db
				.select({ uploadId: questions.uploadId })
				.from(questions)
				.innerJoin(uploads, eq(questions.uploadId, uploads.id))
				.where(and(eq(questions.id, id), eq(uploads.userId, userId)))
				.limit(1);

			if (!result) throw new Error("Not authorized");
			return result.uploadId;
		}
		case tableUploads:
		case folders:
		case uploads: {
			const [result] = await db
				.select({ id: table.id })
				.from(table)
				.where(and(eq(table.id, id), eq(table.userId, userId)))
				.limit(1);

			if (!result) throw new Error("Not authorized");
			return;
		}
		case deadlines: {
			const [result] = await db
				.select({ id: deadlines.id })
				.from(deadlines)
				.where(and(eq(deadlines.id, Number(id)), eq(deadlines.userId, userId)))
				//TODO change this in db to type of string so no conversino needed
				.limit(1);

			if (!result) throw new Error("Not authorized");
		}
	}
}
async function removePdfOrThrow(path: string) {
	const { error } = await removeFile(path);
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
	await assertOwned(uploads, uploadId, await getSessionUserId());
	await normalizeOrder(uploadId);
}
export async function generateWrongOptionsAction(
	question: string,
	answer: string,
	questionId: string,
) {
	const uploadId = await assertOwned(
		questions,
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
export async function deleteItemByNameAction(
	id: string,
	variant: DeleteItemName,
) {
	await assertOwned(string_to_table[variant], id, await getSessionUserId());
	//TODO make pdfs and images delete
	try {
		await db
			.delete(string_to_table[variant])
			.where(eq(string_to_table[variant].id, id));
		revalidatePath("/");
	} catch (error) {
		console.error("Delete error:", error);
		throw new Error(`Failed to delete ${variant}`);
	}
}
export async function updateQuestionTextAction(
	id: string,
	text: string,
	columnName: TextUpdateColumn,
) {
	if (!Object.hasOwn(column_to_table, columnName))
		throw new Error("Invalid text column");
	if (columnName === "title") {
		await changeDeadline(Number(id), { title: text });
		return;
	}
	const table = column_to_table[columnName];
	const uploadId = await assertOwned(table, id, await getSessionUserId());
	await db
		.update(table)
		.set({ [columnName]: text })
		.where(eq(table.id, id));
	revalidatePath(
		uploadId
			? `/uploads/${uploadId}`
			: table === uploads
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
	await assertOwned(tableUploads, tableId, userId);
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
		questions,
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
	//TODO remove sparse ordering sorting
	uploadId: string,
	_insertAtPosition: number,
	prev?: number | null,
	next?: number | null,
) {
	await assertOwned(uploads, uploadId, await getSessionUserId());
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
	await assertOwned(questions, telemetry.questionId, await getSessionUserId());
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
	await assertOwned(deadlines, String(id), userId);
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
export async function updateParentAction(
	id: string,
	parentId: string | null,
	table: ParentTable,
) {
	const userId = await getSessionUserId();
	await assertOwned(string_to_table[table], id, userId);
	if (parentId) await assertOwned(folders, parentId, userId);
	switch (string_to_table[table]) {
		case tableUploads:
		case uploads:
			await db
				.update(string_to_table[table])
				.set({ folderId: parentId })
				.where(eq(string_to_table[table].id, id));
			break;

		case folders:
			await db.update(folders).set({ parentId }).where(eq(folders.id, id));
			break;
	}
	revalidatePath("/");
}
export async function updateFsrsAction(id: string, card: Card) {
	await assertOwned(questions, id, await getSessionUserId());
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
		questions,
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
