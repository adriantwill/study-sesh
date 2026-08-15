"use server";
import type { StudyQuestion } from "@/src/types";
import { createClient } from "./supabase/server";

const DISPLAY_ORDER_STEP = 100;
export async function uploadRecordAction(
	upload_id: string,
	questions: StudyQuestion[],
	pos: number,
) {
	if (questions.length === 0) return 0;

	const supabase = await createClient();
	// Insert questions
	const questionRows = questions.map((q, idx) => ({
		upload_id: upload_id,
		question_text: q.question,
		original_question_text: q.originalQuestion ?? q.question,
		answer_text: q.answer,
		original_answer_text: q.originalAnswer ?? q.answer,
		page_number: q.pageNumber ?? null,
		ocr_text: q.ocrText ?? null,
		fsrs_difficulty: 0,
		fsrs_stability: 0,
		fsrs_due_at: null,
		fsrs_last_reviewed_at: null,
		fsrs_review_count: 0,
		fsrs_state: 0,
		fsrs_scheduled: 0,
		fsrs_learning: 0,
		fsrs_lapses: 0,
		display_order:
			(q.pageNumber ?? pos + 1) * 1000 + (idx + 1) * DISPLAY_ORDER_STEP,
		options: q.options ?? [],
	}));

	const { error } = await supabase
		.from("questions")
		.insert(questionRows as never);

	if (error) {
		console.error("Error inserting questions:", error);
		throw error;
	}

	return questionRows.length;
}
