import Link from "next/link";
import BrandMark from "../../components/BrandMark";
import EditField from "../../components/EditField";
import FlashcardView from "../../components/FlashcardView";
import Test from "../../components/Test";
import { createClient } from "../../lib/supabase/server";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;

  const supabase = await createClient();
  const [
    { data, error },
    { data: upload, error: uploadError },
  ] = await Promise.all([
    supabase
      .from("questions")
      .select(
        "id, upload_id, question_text, answer_text, image_url, display_order, options",
      )
      .eq("upload_id", reviewId)
      .order("display_order", { ascending: true }),
    supabase
      .from("uploads")
      .select("filename, description")
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

  const questions = data.map((q) => ({
    id: q.id,
    upload_id: q.upload_id ?? reviewId,
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
          <div className="flex items-center gap-6">
            <h1 className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 text-3xl font-bold text-foreground">
              <Link href="/" aria-label="Go to home page">
                <BrandMark size={32} />
              </Link>
              <div className="flex min-w-0 flex-1 items-center gap-2 [&>span]:block [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:overflow-hidden [&>span]:whitespace-nowrap [&>textarea]:min-w-0 [&>textarea]:flex-1 [&>div]:shrink-0">
                <EditField variant="filename" textField={title} id={reviewId} />
              </div>
            </h1>
            <div className="flex shrink-0 gap-6">
              <Link
                href={`/study/${reviewId}`}
                className="text-2xl text-primary hover:text-foreground"
              >
                Study
              </Link>
              <Link
                href={`/quiz/${reviewId}`}
                className="text-2xl text-primary hover:text-foreground"
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
        <FlashcardView questions={questions} height="h-104" />
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
