import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { questions as questionsTable, uploads } from "@/drizzle/schema";
import EditTitle from "@/src/components/questions/EditTitle";
import FlashcardView from "@/src/components/study/FlashcardView";
import { db } from "@/src/db";
import { auth } from "@/src/lib/auth";
import { questionRowToStudyQuestion } from "@/src/utils/cards";

export default async function StudyPage({
	params,
}: {
	params: Promise<{ studyId: string }>;
}) {
	const { studyId } = await params;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	}
	const [ownedUpload] = await db
		.select({ id: uploads.id })
		.from(uploads)
		.where(and(eq(uploads.id, studyId), eq(uploads.userId, session.user.id)))
		.limit(1);
	if (!ownedUpload) {
		redirect("/");
	}

	const [data, [upload]] = await Promise.all([
		db
			.select()
			.from(questionsTable)
			.where(
				and(
					eq(questionsTable.uploadId, studyId),
					eq(questionsTable.deleted, false),
				),
			)
			.orderBy(
				asc(questionsTable.fsrsDueAt),
				asc(questionsTable.fsrsLastReviewedAt),
			),
		db.select().from(uploads).where(eq(uploads.id, studyId)).limit(1),
	]);

	if (!upload) throw new Error("Failed to load title");

	const questions = data.map((q) => questionRowToStudyQuestion(q));
	const title = upload.filename;

	// if (new Date(questions[0].fsrsDueAt) <= new Date()) {
	// 	const telemetry: Tables<"events"> = {
	// 		//TODO MAKE THIS A CUSTOM TYPE
	// 		before_difficulty: questions[0].fsrsDifficulty,
	// 		before_stability: questions[0].fsrsStability,
	// 		created_at: new Date().toISOString(),
	// 		difficulty: questions[0].fsrsDifficulty,
	// 		event_type: "card_shown",
	// 		question_id: questions[0].id,
	// 		rating: null,
	// 		stability: questions[0].fsrsStability,
	// 	};
	// 	addTelemetry(telemetry);
	// }
	return (
		<div className="flex min-h-dvh flex-col px-8 py-[clamp(0.75rem,4dvh,2rem)]">
			<EditTitle title={title} reviewId={studyId} />
			<div className="flex flex-1 items-center justify-center py-[clamp(0.25rem,3dvh,1.5rem)]">
				<div className="w-full max-w-5xl [&>[role=listbox]]:space-y-[clamp(0.5rem,4dvh,3rem)]">
					<FlashcardView
						questions={questions}
						height="h-[min(32.5rem,calc(100dvh-18rem))] min-h-80"
						mode="study"
					/>
				</div>
			</div>
		</div>
	);
}
