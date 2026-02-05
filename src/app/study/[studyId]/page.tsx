import { notFound } from "next/navigation";
import FlashcardView from "@/src/components/FlashcardView";
import { createClient } from "@/src/lib/supabase/server";
import type { StudyQuestion } from "@/src/types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StudyPage({
	params,
}: {
	params: Promise<{ studyId: string }>;
}) {
	const { studyId } = await params;
	if (!UUID_REGEX.test(studyId)) notFound();

	let questions: StudyQuestion[] = [
		{
			id: "mock-1",
			question: "What is the capital of France?",
			answer: "Paris",
		},
		{
			id: "mock-2",
			question: "What is the powerhouse of the cell?",
			answer: "Mitochondria",
		},
	];

	if (process.env.MOCK_AI !== "true") {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("questions")
			.select("*")
			.eq("upload_id", studyId)
			.order("display_order", { ascending: true });

		if (error) {
			console.error("Error fetching questions:", error);
			throw new Error("Failed to load questions");
		}

		if (!data) {
			throw new Error("No questions found");
		}

		questions = data.map((q) => ({
			id: q.id,
			question: q.question_text,
			answer: q.answer_text,
			imageUrl: q.image_url,
		}));
	}

	return (
		<div className="flex justify-center items-center min-h-screen">
			<div className="w-8/12">
				<FlashcardView questions={questions} height="h-130" />
			</div>
		</div>
	);
}
