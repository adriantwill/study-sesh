import QuizCard from "@/src/components/QuizCard";
import { createClient } from "@/src/lib/supabase/server";
import { StudyQuestion } from "@/src/types";
import { ChevronDown, ChevronUp } from "lucide-react";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  let title = "Test title";
  let questions: StudyQuestion[] = [
    {
      id: "mock-1",
      question: "What is the capital of France?",
      answer: "Paris",
      pageNumber: 1,
      completed: true,
    },
    {
      id: "mock-2",
      question: "What is the powerhouse of the cell?",
      answer: "Mitochondria",
      pageNumber: 1,
      completed: false,
    },
    {
      id: "mock-3",
      question: "Explain the concept of photosynthesis.",
      answer:
        "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.",
      pageNumber: 2,
      completed: false,
    },
    {
      id: "mock-4",
      question: "Who wrote 'To Kill a Mockingbird'?",
      answer: "Harper Lee",
      pageNumber: 3,
      completed: false,
    },
  ];
  if (process.env.MOCK_AI !== "true") {
    const supabase = await createClient();
    const param = await params;
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("upload_id", param.quizId)
      .order("page_number", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      throw new Error("Failed to load questions");
    }

    if (!data) {
      throw new Error("No questions found");
    }

    const { data: studyTitle, error: titleError } = await supabase
      .from("uploads")
      .select("filename")
      .eq("id", param.quizId)
      .single();

    if (titleError) {
      console.error("Error fetching title:", titleError);
      throw new Error("Failed to load title");
    }

    questions = data.map((q) => ({
      id: q.id,
      question: q.question_text,
      answer: q.answer_text,
      pageNumber: q.page_number,
      completed: q.completed,
      imageUrl: q.image_url,
    }));
    title = studyTitle.filename;
  }
  return (
    <div className="min-h-screen bg-background p-8 flex flex-col">
      <div className="max-w-4xl mx-auto flex flex-col flex-1 w-full">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-foreground">{title}</h1>
        </div>
        <QuizCard questions={questions} />
      </div>
    </div>
  );
}
