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
    <>
      <h1 className="absolute left-1/2 top-8 flex -translate-x-1/2 items-center gap-2 text-center text-3xl font-bold text-foreground">
        <Link href="/" aria-label="Go to home page">
          <BrandMark size={32} />
        </Link>
        <span className="text-nowrap overflow-hidden">{title}</span>
      </h1>
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8/12">
          <FlashcardView questions={questions} height="h-130" />
        </div>
      </div>
    </>
  );
}
