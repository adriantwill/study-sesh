import { createClient } from "@/src/lib/supabase/server";
import { StudyQuestion } from "@/src/types";
import StudyClient from "./StudyClient";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ studyId: string }>;
}) {
  let questions: StudyQuestion[] = [
    {
      id: "mock-1",
      question: "What is the capital of France?",
      answer: "Paris",
      completed: false,
    },
    {
      id: "mock-2",
      question: "What is the powerhouse of the cell?",
      answer: "Mitochondria",
      completed: true,
    },
  ];

  if (process.env.MOCK_AI !== "true") {
    const supabase = await createClient();
    const param = await params;
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("upload_id", param.studyId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

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
      completed: q.completed,
      imageUrl: q.image_url,
    }));
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex items-center justify-center">
      <StudyClient questions={questions} />
    </div>
  );
}
