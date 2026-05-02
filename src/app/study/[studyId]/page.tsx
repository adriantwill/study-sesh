import Link from "next/link";
import BrandMark from "@/src/components/BrandMark";
import FlashcardView from "@/src/components/FlashcardView";
import { createClient } from "@/src/lib/supabase/server";

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
          "id, upload_id, question_text, answer_text, image_url, display_order",
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

  const questions = data.map((q) => ({
    id: q.id,
    upload_id: q.upload_id ?? studyId,
    question: q.question_text,
    answer: q.answer_text,
    imageUrl: q.image_url,
    displayOrder: q.display_order,
  }));

  const title = upload.filename;

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 sm:py-8">
      <h1 className="mx-auto flex w-full max-w-5xl min-w-0 items-center justify-center gap-2 text-center font-bold text-foreground text-3xl">
        <Link href="/" aria-label="Go to home page" className="shrink-0">
          <BrandMark size={32} />
        </Link>
        <span className="min-w-0 truncate whitespace-nowrap">{title}</span>
      </h1>
      <div className="flex flex-1 items-center justify-center py-6">
        <div className="w-full max-w-5xl ">
          <FlashcardView questions={questions} height="h-130" />
        </div>
      </div>
    </div>
  );
}
