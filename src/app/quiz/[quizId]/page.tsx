import { notFound } from "next/navigation";
import QuizCard from "@/src/components/QuizCard";
import { parseMarkdown } from "@/src/lib/markdown";
import { createClient } from "@/src/lib/supabase/server";
import type { StudyQuestion } from "@/src/types";
import QuizClient from "./QuizClient";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  if (!UUID_REGEX.test(quizId)) notFound();

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
    {
      id: "mock-3",
      question: "Explain the concept of photosynthesis.",
      answer:
        "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.",
    },
    {
      id: "mock-4",
      question: "Who wrote 'To Kill a Mockingbird'?",
      answer: "Harper Lee",
    },
  ];
  if (process.env.MOCK_AI !== "true") {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("upload_id", quizId)
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
    <div className="max-w-5xl mx-auto">
      {questions.map((q, i) => (
        <div
          key={q.id}
          className="h-screen snap-start my-auto px-6 flex flex-col items-center justify-center"
        >
          <div className="px-12 py-6 w-full h-145 rounded-lg shadow bg-muted flex flex-col ">
            <div className="text-muted-foreground">Question {i + 1}</div>
            <div className="flex flex-col justify-center space-y-24 flex-1">
              <div className="text-3xl font-medium text-center text-foreground whitespace-pre-wrap">
                {parseMarkdown(q.question)}
              </div>
              <div className="space-y-6">
                <textarea
                  rows={1}
                  className="w-full text-2xl px-4 py-3 font-bold text-foreground bg-muted-hover rounded resize-none border-none outline-none"
                  placeholder="Your answer..."
                />
                <QuizClient answer={q.answer} />
              </div>
            </div>
          </div>
          <QuizCard />
        </div>
      ))}
    </div>
  );
}
