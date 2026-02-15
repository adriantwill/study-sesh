import Link from "next/link";
import type { Tables } from "@/src/types/database.types";
import Test from "../../components/Test";
import EditField from "../../components/EditField";
import FlashcardView from "../../components/FlashcardView";
import { createClient } from "../../lib/supabase/server";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;

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

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .select("filename, description")
    .eq("id", reviewId)
    .single();

  if (uploadError) {
    console.error("Error fetching title:", uploadError);
    throw new Error("Failed to load title");
  }

  const questions = data.map((q: Tables<"questions">) => ({
    id: q.id,
    question: q.question_text,
    answer: q.answer_text,
    imageUrl: q.image_url,
    displayOrder: q.display_order,
    options: q.options,
  }));

  const title = upload.filename;
  const description = upload.description
    ? upload.description
    : "No description provided";

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl space-y-10 mx-auto">
        <div className="space-y-2">
          <div className="flex justify-between items-center ">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Link href="/">🏠</Link>
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
          <div className="flex">
            <div className="flex gap-2">
              <EditField
                variant="description"
                textField={description}
                id={reviewId}
              />
            </div>
          </div>
        </div>
        <FlashcardView questions={questions} />
        <div className="h-px opacity-40 bg-foreground"></div>
        <div className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">
            Question Bank
          </h2>

          <Test questions={questions} reviewId={reviewId} />
        </div>
      </div>
    </div>
  );
}
