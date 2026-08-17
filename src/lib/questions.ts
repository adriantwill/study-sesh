"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { questions as questionsTable, uploads } from "@/drizzle/schema";
import { db } from "@/src/db";
import { auth } from "@/src/lib/auth";
import type { StudyQuestion } from "@/src/types";

const DISPLAY_ORDER_STEP = 100;

export async function uploadRecordAction(
	uploadId: string,
	questions: StudyQuestion[],
	position: number,
) {
	if (questions.length === 0) return 0;

	const session = await auth.api.getSession({ headers: await headers() });
	const userId = session?.user.id;
	if (!userId) throw new Error("Not authenticated");

	const [ownedUpload] = await db
		.select({ id: uploads.id })
		.from(uploads)
		.where(and(eq(uploads.id, uploadId), eq(uploads.userId, userId)))
		.limit(1);
	if (!ownedUpload) throw new Error("Not authorized");

	const questionRows = questions.map(
		(question, index) =>
			({
				uploadId,
				questionText: question.question,
				originalQuestionText: question.originalQuestion ?? question.question,
				answerText: question.answer,
				originalAnswerText: question.originalAnswer ?? question.answer,
				pageNumber: question.pageNumber ?? null,
				ocrText: question.ocrText ?? null,
				fsrsDifficulty: 0,
				fsrsStability: 0,
				fsrsDueAt: question.fsrsDue.toISOString(),
				fsrsLastReviewedAt: question.fsrsLastReviewed.toISOString(),
				fsrsReviewCount: 0,
				fsrsState: 0,
				fsrsScheduled: 0,
				fsrsLearning: 0,
				fsrsLapses: 0,
				displayOrder:
					(question.pageNumber ?? position + 1) * 1000 +
					(index + 1) * DISPLAY_ORDER_STEP,
				options: question.options ?? [],
			}) satisfies typeof questionsTable.$inferInsert,
	);

	try {
		await db.insert(questionsTable).values(questionRows);
	} catch (error) {
		console.error("Error inserting questions:", error);
		throw error;
	}

	return questionRows.length;
}
