import Link from "next/link";
import { notFound } from "next/navigation";
import DNDContext from "../../components/DNDContext";
import EditField from "../../components/EditField";
import FlashcardView from "../../components/FlashcardView";
import { createClient } from "../../lib/supabase/server";
import type { StudyQuestion } from "../../types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  if (!UUID_REGEX.test(reviewId)) notFound();

  let title = "Test title";
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
      .eq("upload_id", reviewId)
      .order("display_order", { ascending: true });

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
      .eq("id", reviewId)
      .single();

    if (titleError) {
      console.error("Error fetching title:", titleError);
      throw new Error("Failed to load title");
    }

    questions = data.map((q) => ({
      id: q.id,
      question: q.question_text,
      answer: q.answer_text,
      imageUrl: q.image_url,
      displayOrder: q.display_order,
    }));
    title = studyTitle.filename;
  }
  //TODO fix supabase RLS
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl space-y-10 mx-auto">
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Link href={"/"}>
              🏠
            </Link>
            <EditField variant="filename" textField={title} id={reviewId} />
          </h1>
          <div className="flex gap-6">
            <Link
              href={`/study/${reviewId}`}
              className="text-2xl text-primary hover:text-secondary"
            >
              Study
            </Link>
            <Link
              href={`/quiz/${reviewId}`}
              className="text-2xl text-primary hover:text-secondary"
            >
              Quiz
            </Link>
          </div>
        </div>

        <FlashcardView questions={questions} />
        <div className="h-px opacity-40 bg-foreground"></div>
        <div className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">
            Question Bank
          </h2>

          <DNDContext questions={questions} reviewId={reviewId} />
        </div>
      </div>
    </div>
  );
}
