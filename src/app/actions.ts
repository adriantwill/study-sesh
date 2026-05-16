"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import {
	generateQuestions,
	generateWrongOptions,
} from "../lib/ai/question-generator";
import { uploadRecordAction } from "../lib/questions";
import {
	getQuestionImagePublicUrl,
	removePdf,
	uploadPdf,
	uploadQuestionImage,
} from "../lib/storage";
import { createClient } from "../lib/supabase/server";
import { isParsedTableData, parseXlsxTable } from "../lib/xlsx-table";
import type { parentColumnByTable, StudyQuestion } from "../types";
import type { Database, Json } from "../types/database.types";

const DISPLAY_ORDER_STEP = 100;
type PublicTables = Database["public"]["Tables"];
type ActionTableName = keyof PublicTables;
type ActionColumnName<T extends ActionTableName> = keyof PublicTables[T]["Row"];
type UploadStatus = "processing" | "completed" | "failed";

async function removePdfOrThrow(storagePath: string) {
	const { error } = await removePdf(storagePath);
	if (error) {
		console.error("Error deleting PDF from storage:", error);
		throw new Error("Failed to delete PDF from storage");
	}
}

async function updateUploadStatus(uploadId: string, status: UploadStatus) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("uploads")
		.update({ status })
		.eq("id", uploadId);
	if (error) {
		console.error("Error updating upload status:", error);
		throw new Error("Failed to update upload status");
	}
}

export async function normalizeQuestionDisplayOrder(uploadId: string) {
	const supabase = await createClient();
	const { error } = await supabase.rpc("normalize_question_display_order", {
		p_upload_id: uploadId,
	});
	if (error) throw new Error("Failed to normalize question order");
}

export async function generateWrongOptionsAction(
	question: string,
	answer: string,
	questionId: string,
) {
	return generateWrongOptions(question, answer, questionId);
}

export async function uploadRecordActionTEMP(
	uploadId: string,
	questionList: StudyQuestion[],
	displayOrder: number,
) {
	await uploadRecordAction(uploadId, questionList, displayOrder);
}

export async function uploadAndGenerateAction(formData: FormData) {
	const file = formData.get("pdf") as File;
	if (!(file instanceof File) || file.size === 0)
		throw new Error("No PDF provided");
	if (file.type !== "application/pdf") throw new Error("Only PDFs supported");
	const pdfBuffer = Buffer.from(await file.arrayBuffer());
	const upload = await createUpload(file);
	after(async () => {
		try {
			await generateQuestions(pdfBuffer, upload.id);
			await updateUploadStatus(upload.id, "completed");
			revalidatePath(`/uploads/${upload.id}`);
		} catch (error) {
			console.error("Background question generation error:", error);
			await updateUploadStatus(upload.id, "failed");
		}
	});
	// if (questions.length === 0) {
	// 	throw new Error("No questions generated from this PDF");
	// }
	revalidatePath("/");
	return { uploadId: upload.id };
}

export async function uploadTableAction(formData: FormData) {
	const file = formData.get("xlsx") as File;
	if (!(file instanceof File) || file.size === 0)
		throw new Error("No XLSX provided");

	const isXlsx =
		file.name.toLowerCase().endsWith(".xlsx") ||
		file.type ===
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

	if (!isXlsx) throw new Error("Only XLSX files supported");

	const supabase = await createClient();
	const parsedTable = parseXlsxTable(await file.arrayBuffer());

	const { data: tableUpload, error: tableUploadError } = await supabase
		.from("table_uploads")
		.insert({
			filename: file.name,
			parsed_data: parsedTable as unknown as Json,
		})
		.select()
		.single();

	if (tableUploadError || !tableUpload) {
		console.error("Error inserting table upload:", tableUploadError);
		throw new Error("Failed to save table upload to database");
	}

	revalidatePath("/");
	return { tableUploadId: tableUpload.id };
}

export async function createUpload(source: File | string) {
	const supabase = await createClient();
	const isFileUpload = source instanceof File;
	const filename = isFileUpload ? source.name : source;
	let storagePath: string | null = null;

	if (isFileUpload) {
		const safeName = source.name.replace(/[^a-zA-Z0-9._-]/g, "_");
		storagePath = `${crypto.randomUUID()}-${safeName}`;

		const { error: storageError } = await uploadPdf(storagePath, source);

		if (storageError) {
			console.error("Error uploading PDF:", storageError);
			throw new Error("Failed to save PDF to storage");
		}
	}

	const { data: upload, error: uploadError } = await supabase
		.from("uploads")
		.insert({
			filename,
			status: isFileUpload ? "processing" : "completed",
			storage_path: storagePath,
		})
		.select()
		.single();
	if (uploadError || !upload) {
		console.error("Error inserting upload:", uploadError);
		if (storagePath) {
			await removePdfOrThrow(storagePath);
		}
		throw new Error("Failed to save upload to database");
	}

	// Insert questions
	return upload;
}

export async function deleteItemAction(id: string, variant: ActionTableName) {
	const supabase = await createClient();

	try {
		switch (variant) {
			case "table_uploads": {
				const { error } = await supabase.from(variant).delete().eq("id", id);
				if (error) throw error;
				revalidatePath("/");
				break;
			}
			case "questions": {
				const { error } = await supabase
					.from("questions")
					.update({ deleted: true })
					.eq("id", id);
				if (error) throw error;
				revalidatePath(`/uploads/${id}`, "page");
				break;
			}
			case "folders": {
				const { error: detachError } = await supabase
					.from("uploads")
					.update({ folder_id: null })
					.eq("folder_id", id);

				if (detachError) throw detachError;

				const { error: detachFoldersError } = await supabase
					.from("folders")
					.update({ parent_id: null } as never)
					.eq("parent_id", id);

				if (detachFoldersError) throw detachFoldersError;

				const { error } = await supabase.from("folders").delete().eq("id", id);
				if (error) throw error;
				revalidatePath("/");
				break;
			}
			case "uploads": {
				const { data: upload } = await supabase
					.from("uploads")
					.select("storage_path")
					.eq("id", id)
					.single();

				const { error: deleteQuestionsError } = await supabase
					.from("questions")
					.delete()
					.eq("upload_id", id);

				if (deleteQuestionsError) throw deleteQuestionsError;

				if (upload?.storage_path) {
					await removePdfOrThrow(upload.storage_path);
				}

				const { error } = await supabase.from("uploads").delete().eq("id", id);
				if (error) throw error;

				revalidatePath("/");
				break;
			}
		}
	} catch (error) {
		console.error("Delete error:", error);
		throw new Error(`Failed to delete ${variant}`);
	}
}

export async function updateQuestionTextAction<T extends ActionTableName>(
	id: string,
	text: string,
	table: T,
	column: ActionColumnName<T>,
) {
	const supabase = await createClient();

	const { error } = await supabase
		.from(table)
		.update({ [column]: text } as never)
		.eq("id", id as never);

	if (error) {
		console.error("Update text error:", error);
		throw new Error("Failed to update text");
	}

	revalidatePath(`/uploads/${id}`, "page");
}

export async function updateTableCellAction(
	tableId: string,
	rowIndex: number,
	header: string,
	value: string,
) {
	const supabase = await createClient();

	const { data, error: fetchError } = await supabase
		.from("table_uploads")
		.select("parsed_data")
		.eq("id", tableId)
		.single();

	if (fetchError || !data) {
		console.error("Load table error:", fetchError);
		throw new Error("Failed to load table");
	}

	if (!isParsedTableData(data.parsed_data)) {
		throw new Error("Invalid table data");
	}

	const row = data.parsed_data.rows[rowIndex];
	if (!row || !(header in row)) {
		throw new Error("Invalid cell");
	}

	const nextTable = {
		headers: [...data.parsed_data.headers],
		rows: data.parsed_data.rows.map((currentRow, currentIndex) =>
			currentIndex === rowIndex
				? { ...currentRow, [header]: value }
				: { ...currentRow },
		),
	};

	const { error: updateError } = await supabase
		.from("table_uploads")
		.update({ parsed_data: nextTable as unknown as Json })
		.eq("id", tableId);

	if (updateError) {
		console.error("Update table cell error:", updateError);
		throw new Error("Failed to update table cell");
	}

	revalidatePath(`/tables_uploads/${tableId}`);
}

export async function uploadImageAction(
	questionId: string,
	formData: FormData,
) {
	const supabase = await createClient();
	const file = formData.get("file") as File;

	if (!file || !questionId) return;

	const fileExt = file.name.split(".").pop();
	const fileName = `${questionId}_${Date.now()}.${fileExt}`;
	const filePath = `question-images/${fileName}`;

	const { error: uploadError } = await uploadQuestionImage(filePath, file);

	if (uploadError) {
		console.error("Storage upload error:", uploadError);
		throw new Error("Failed to upload image");
	}

	const publicUrl = await getQuestionImagePublicUrl(filePath);

	const { error: dbError } = await supabase
		.from("questions")
		.update({ image_url: publicUrl })
		.eq("id", questionId);

	if (dbError) {
		console.error("DB update error:", dbError);
		throw new Error("Failed to link image to question");
	}

	revalidatePath(`/uploads/${questionId}`, "page");
}

export async function addQuestionAction(
	uploadId: string,
	insertAtPosition: number,
	prevDisplayOrder?: number | null,
	nextDisplayOrder?: number | null,
) {
	const supabase = await createClient();
	void insertAtPosition;

	const getDisplayOrder = (
		prevOrder?: number | null,
		nextOrder?: number | null,
	) => {
		if (prevOrder == null)
			return Math.floor((nextOrder ?? DISPLAY_ORDER_STEP) / 2);
		if (nextOrder == null) return prevOrder + DISPLAY_ORDER_STEP;
		return Math.floor((prevOrder + nextOrder) / 2);
	};

	const displayOrder = getDisplayOrder(prevDisplayOrder, nextDisplayOrder);

	const { data: insertedQuestion, error } = await supabase
		.from("questions")
		.insert({
			upload_id: uploadId,
			question_text: "Untitled Question",
			original_question_text: "User Added Question",
			answer_text: "Untitled Answer",
			original_answer_text: "Untitled Answer",
			page_number: null,
			ocr_text: null,
			display_order: displayOrder,
		} as never)
		.select("id")
		.single();

	if (error || !insertedQuestion) {
		console.error("Add question error:", error);
		throw new Error("Failed to add question");
	}
	revalidatePath(`/uploads/${uploadId}`);
	if (
		prevDisplayOrder != null &&
		nextDisplayOrder != null &&
		displayOrder === prevDisplayOrder + 1
	) {
		after(async () => {
			try {
				await normalizeQuestionDisplayOrder(uploadId);
				revalidatePath(`/uploads/${uploadId}`);
			} catch (error) {
				console.error("Background normalize question order error:", error);
			}
		});
	}
}

export async function addFolderAction() {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("folders")
		.insert({
			name: "Untitled Folder",
		})
		.select()
		.single();

	if (error || !data) {
		console.error("Add folder error:", error);
		throw new Error("Failed to add folder");
	}

	revalidatePath("/");

	return data;
}

export async function updateParentAction<
	T extends keyof typeof parentColumnByTable,
>(
	id: string,
	parentId: string | null,
	table: T,
	column: (typeof parentColumnByTable)[T],
) {
	const supabase = await createClient();

	const { error } = await supabase
		.from(table)
		.update({ [column]: parentId } as never)
		.eq("id", id as never);

	if (error) {
		console.error("Update parent error:", error);
		throw new Error(`Failed to update ${table} parent`);
	}

	revalidatePath("/");
}
type ReorderQuestion = Pick<StudyQuestion, "id" | "displayOrder" | "upload_id">;
export async function reorderQuestionsAction(
	activeId: string,
	questions: ReorderQuestion[],
) {
	if (questions.length === 0) return;

	const supabase = await createClient();
	const activeIndex = questions.findIndex(
		(question) => question.id === activeId,
	);

	if (activeIndex === -1) {
		throw new Error("Question not found");
	}

	const activeQuestion = questions[activeIndex];
	const prevQuestion = activeIndex > 0 ? questions[activeIndex - 1] : null;
	const nextQuestion =
		activeIndex < questions.length - 1 ? questions[activeIndex + 1] : null;

	const getDisplayOrder = (
		prevOrder?: number | null,
		nextOrder?: number | null,
	) => {
		if (prevOrder == null)
			return Math.floor((nextOrder ?? DISPLAY_ORDER_STEP) / 2);
		if (nextOrder == null) return prevOrder + DISPLAY_ORDER_STEP;
		return Math.floor((prevOrder + nextOrder) / 2);
	};

	let nextDisplayOrder = getDisplayOrder(
		prevQuestion?.displayOrder,
		nextQuestion?.displayOrder,
	);

	if (
		prevQuestion &&
		nextQuestion &&
		nextDisplayOrder === prevQuestion.displayOrder + 1
	) {
		await normalizeQuestionDisplayOrder(activeQuestion.upload_id);

		const { data: normalizedNeighbors, error: normalizedNeighborsError } =
			await supabase
				.from("questions")
				.select("id, display_order")
				.in("id", [prevQuestion.id, nextQuestion.id]);

		if (normalizedNeighborsError) {
			console.error(
				"Reorder normalized neighbor fetch error:",
				normalizedNeighborsError,
			);
			throw new Error("Failed to load normalized question positions");
		}

		nextDisplayOrder = getDisplayOrder(
			normalizedNeighbors?.find((question) => question.id === prevQuestion.id)
				?.display_order,
			normalizedNeighbors?.find((question) => question.id === nextQuestion.id)
				?.display_order,
		);

		if (nextDisplayOrder <= 0) {
			throw new Error("Failed to load normalized question positions");
		}
	}

	const { error } = await supabase
		.from("questions")
		.update({ display_order: nextDisplayOrder })
		.eq("id", activeId);

	if (error) {
		console.error("Reorder question error:", error);
		throw new Error("Failed to reorder questions");
	}

	revalidatePath(`/uploads/${activeQuestion.upload_id}`);
}
