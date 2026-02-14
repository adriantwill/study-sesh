import FlashcardView from "@/src/components/FlashcardView";
import { createClient } from "@/src/lib/supabase/server";

export default async function StudyPage({
	params,
}: {
	params: Promise<{ studyId: string }>;
}) {
	const { studyId } = await params;

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

  const questions = data.map((q) => ({
    id: q.id,
    question: q.question_text,
    answer: q.answer_text,
    imageUrl: q.image_url,
  }));

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8/12">
        <FlashcardView questions={questions} height="h-130" />
      </div>
    </div>
  );
}
