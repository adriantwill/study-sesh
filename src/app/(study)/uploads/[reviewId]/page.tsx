import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { questions as questionsTable, uploads } from "@/drizzle/schema";
import EditField from "@/src/components/questions/EditField";
import EditTitle from "@/src/components/questions/EditTitle";
import GenerationPoller from "@/src/components/questions/GenerationPoller";
import QuestionList from "@/src/components/questions/QuestionList";
import FlashcardView from "@/src/components/study/FlashcardView";
import ScrollToTopButton from "@/src/components/ui/ScrollToTopButton";
import { db } from "@/src/db";
import { auth } from "@/src/lib/auth";
import { questionRowToStudyQuestion } from "@/src/utils/cards";

export default async function ReviewPage({
	params,
}: {
	params: Promise<{ reviewId: string }>;
}) {
	const { reviewId } = await params;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	}
	const [ownedUpload] = await db
		.select({ id: uploads.id })
		.from(uploads)
		.where(and(eq(uploads.id, reviewId), eq(uploads.userId, session.user.id)))
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
					eq(questionsTable.uploadId, reviewId),
					eq(questionsTable.deleted, false),
				),
			)
			.orderBy(asc(questionsTable.displayOrder)),
		db.select().from(uploads).where(eq(uploads.id, reviewId)).limit(1),
	]);

	if (!upload) throw new Error("Failed to load title");

	const questions = data.map((q) => questionRowToStudyQuestion(q));
	const isGenerating = upload.status === "processing";

	const title = upload.filename;
	const description = upload.description ?? "No description provided";

	return (
		<div className="min-h-dvh p-8">
			<GenerationPoller enabled={isGenerating} />
			<div className="mx-auto max-w-4xl space-y-10">
				<div className="space-y-2">
					<div className="flex min-w-0 items-center justify-between gap-4">
						<EditTitle title={title} reviewId={reviewId} />
						<div className="flex shrink-0 gap-4">
							<Link
								href={`/study/${reviewId}`}
								className="whitespace-nowrap text-xl text-primary hover:text-foreground"
							>
								Study
							</Link>
							<Link
								href={`/quiz/${reviewId}`}
								className="whitespace-nowrap text-xl text-primary hover:text-foreground"
							>
								Quiz
							</Link>
						</div>
					</div>
					<div className="flex w-fit gap-2">
						<EditField
							textField={description}
							id={reviewId}
							columnName="description"
						/>
					</div>
				</div>
				{questions.length > 0 ? (
					<FlashcardView
						questions={questions}
						height="h-[min(26rem,calc(100dvh-14rem))] min-h-80"
					/>
				) : (
					<div className="py-20 text-center text-muted-foreground">
						{isGenerating
							? "Questions are processing..."
							: "No questions found."}
					</div>
				)}
				<div className="h-px bg-foreground/40" />
				<div className="space-y-4">
					<h2 className="text-2xl font-medium text-foreground">
						Question Bank
					</h2>
					<QuestionList questions={questions} reviewId={reviewId} />
				</div>
			</div>
			<ScrollToTopButton />
		</div>
	);
}
