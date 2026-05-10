import QuizCard from "@/src/components/QuizCard";
import QuizChoices from "@/src/components/QuizChoices";
import { parseMarkdown } from "@/src/lib/markdown";
import { createClient } from "@/src/lib/supabase/server";
import { questionRowToStudyQuestion } from "@/src/utils/cards";

export default async function QuizPage({
	params,
}: {
	params: Promise<{ quizId: string }>;
}) {
	const { quizId } = await params;

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("questions")
		.select(
			"id, upload_id, question_text, answer_text, image_url, display_order, options",
		)
		.eq("upload_id", quizId)
		.eq("deleted", false)
		.order("display_order", { ascending: true });

	if (error) {
		console.error("Error fetching questions:", error);
		throw new Error("Failed to load questions");
	}

	if (!data) {
		throw new Error("No questions found");
	}

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
								{parseMarkdown(q.question)}
							</div>
							<QuizChoices choices={q.options ?? []} answer={q.answer} />
						</div>
					</div>
					<QuizCard />
				</div>
			))}
		</div>
	);
}
