import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { questions as questionsTable, uploads } from "@/drizzle/schema";
import QuizCard from "@/src/components/quiz/QuizCard";
import QuizChoices from "@/src/components/quiz/QuizChoices";
import { db } from "@/src/db";
import { auth } from "@/src/lib/auth";
import { parseMarkdown } from "@/src/lib/markdown";
import { questionRowToStudyQuestion } from "@/src/utils/cards";

export default async function QuizPage({
	params,
}: {
	params: Promise<{ quizId: string }>;
}) {
	const { quizId } = await params;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	}
	const [ownedUpload] = await db
		.select({ id: uploads.id })
		.from(uploads)
		.where(and(eq(uploads.id, quizId), eq(uploads.userId, session.user.id)))
		.limit(1);
	if (!ownedUpload) {
		redirect("/");
	}

	const data = await db
		.select()
		.from(questionsTable)
		.where(
			and(
				eq(questionsTable.uploadId, quizId),
				eq(questionsTable.deleted, false),
			),
		)
		.orderBy(asc(questionsTable.displayOrder));

	const questions = data.map((q) => questionRowToStudyQuestion(q));
	return (
		<div className="mx-auto max-w-5xl">
			{questions.map((q, i) => (
				<div
					key={q.id}
					className="flex min-h-dvh snap-start flex-col items-center justify-center px-6 py-8"
				>
					<div className="flex h-[min(36rem,calc(100dvh-6rem))] min-h-96 w-full flex-col overflow-y-auto rounded-lg bg-muted px-8 py-6 shadow">
						<div className="text-muted-foreground">Question {i + 1}</div>
						<div className="flex flex-1 flex-col justify-center space-y-16">
							<div className="whitespace-pre-wrap text-center text-[clamp(1.5rem,4vw,1.875rem)] font-medium text-foreground">
								{parseMarkdown(q.questionText)}
							</div>
							<QuizChoices choices={q.options ?? []} answer={q.answerText} />
						</div>
					</div>
					<QuizCard />
				</div>
			))}
		</div>
	);
}
