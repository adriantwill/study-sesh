import EditTitle from "@/src/components/EditTitle";
import FlashcardView from "@/src/components/FlashcardView";
import { createClient } from "@/src/lib/supabase/server";
import { questionRowToStudyQuestion } from "@/src/utils/cards";

export default async function StudyPage({
	params,
}: {
	params: Promise<{ studyId: string }>;
}) {
	const { studyId } = await params;

	const supabase = await createClient();
	const [{ data, error }, { data: upload, error: uploadError }] =
		await Promise.all([
			supabase
				.from("questions")
				.select(
					"id, upload_id, question_text, answer_text, image_url, display_order, options",
				)
				.eq("upload_id", studyId)
				.eq("deleted", false)
				.order("display_order", { ascending: true }),
			supabase.from("uploads").select("filename").eq("id", studyId).single(),
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

	const title = upload.filename;

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
