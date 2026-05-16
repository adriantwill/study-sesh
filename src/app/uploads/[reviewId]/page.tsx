import Link from "next/link";
import EditTitle from "@/src/components/EditTitle";
import GenerationPoller from "@/src/components/GenerationPoller";
import ScrollToTopButton from "@/src/components/ScrollToTopButton";
import { questionRowToStudyQuestion } from "@/src/utils/cards";
import EditField from "../../../components/EditField";
import FlashcardView from "../../../components/FlashcardView";
import QuestionList from "../../../components/QuestionList";
import { createClient } from "../../../lib/supabase/server";

export default async function ReviewPage({
	params,
}: {
	params: Promise<{ reviewId: string }>;
}) {
	const { reviewId } = await params;

	const supabase = await createClient();
	const [{ data, error }, { data: upload, error: uploadError }] =
		await Promise.all([
			supabase
				.from("questions")
				.select(
					"id, upload_id, question_text, answer_text, image_url, display_order, options",
				)
				.eq("upload_id", reviewId)
				.eq("deleted", false)
				.order("display_order", { ascending: true }),
			supabase
				.from("uploads")
				.select("filename, description, status")
				.eq("id", reviewId)
				.single(),
		]);

	if (error) {
		console.error("Error fetching questions:", error);
		throw new Error("Failed to load questions");
	}

	if (!data) {
		throw new Error("No questions found");
	}

	if (uploadError) {
		console.error("Error fetching title:", uploadError);
		throw new Error("Failed to load title");
	}

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
							table="uploads"
							col="description"
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
