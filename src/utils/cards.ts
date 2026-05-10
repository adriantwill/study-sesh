import type { StudyQuestion } from "../types";
import type { Tables } from "../types/database.types";

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
	};
}
