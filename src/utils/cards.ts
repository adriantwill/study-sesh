import type { Question, StudyQuestion } from "@/src/types";

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
		Question,
		| "id"
		| "uploadId"
		| "questionText"
		| "answerText"
		| "imageUrl"
		| "displayOrder"
		| "options"
		| "fsrsDifficulty"
		| "fsrsDueAt"
		| "fsrsLapses"
		| "fsrsLastReviewedAt"
		| "fsrsLearning"
		| "fsrsReviewCount"
		| "fsrsScheduled"
		| "fsrsStability"
		| "fsrsState"
	>,
): StudyQuestion {
	return {
		id: q.id,
		upload_id: q.uploadId,
		question: q.questionText,
		answer: q.answerText,
		imageUrl: q.imageUrl,
		displayOrder: q.displayOrder ?? 0,
		options: q.options,
		fsrsDifficulty: q.fsrsDifficulty ?? 0,
		fsrsStability: q.fsrsStability ?? 0,
		fsrsDue: new Date(q.fsrsDueAt),
		fsrsLastReviewed: new Date(q.fsrsLastReviewedAt),
		fsrsReviewCount: q.fsrsReviewCount ?? 0,
		fsrsState: q.fsrsState ?? 0,
		fsrsScheduled: q.fsrsScheduled ?? 0,
		fsrsLearning: q.fsrsLearning ?? 0,
		fsrsLapses: q.fsrsLapses ?? 0,
	};
}
