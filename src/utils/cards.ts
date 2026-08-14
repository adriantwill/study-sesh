import type { StudyQuestion } from "@/src/types";
import type { Tables } from "@/src/types/database.types";

export function shuffleArray<T>(items: T[]): T[] {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}
export function questionRowToStudyQuestion(
	q: Pick<
		Tables<"questions">,
		| "id"
		| "upload_id"
		| "question_text"
		| "answer_text"
		| "image_url"
		| "display_order"
		| "options"
		| "fsrs_difficulty"
		| "fsrs_due_at"
		| "fsrs_lapses"
		| "fsrs_last_reviewed_at"
		| "fsrs_learning"
		| "fsrs_review_count"
		| "fsrs_scheduled"
		| "fsrs_stability"
		| "fsrs_state"
	>,
): StudyQuestion {
	return {
		id: q.id,
		upload_id: q.upload_id,
		question: q.question_text,
		answer: q.answer_text,
		imageUrl: q.image_url,
		displayOrder: q.display_order ?? 0,
		options: q.options,
		fsrsDifficulty: q.fsrs_difficulty ?? 0,
		fsrsStability: q.fsrs_stability ?? 0,
		fsrsDue: new Date(q.fsrs_due_at ?? Date.now()),
		fsrsLastReviewed: new Date(q.fsrs_last_reviewed_at ?? Date.now()),
		fsrsReviewCount: q.fsrs_review_count ?? 0,
		fsrsState: q.fsrs_state ?? 0,
		fsrsScheduled: q.fsrs_scheduled ?? 0,
		fsrsLearning: q.fsrs_learning ?? 0,
		fsrsLapses: q.fsrs_lapses ?? 0,
	};
}
