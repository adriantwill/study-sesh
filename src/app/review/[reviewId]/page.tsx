import { createClient } from "../../../lib/supabase/client";
import ResetUploadButton from "@/src/components/ResetUploadButton";
import QuestionCard from "@/src/components/QuestionCard";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const supabase = createClient();
  const param = await params;
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("upload_id", param.reviewId)
    .order("page_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching questions:", error);
    return null;
  }
  const questions = data.map((q) => ({
    id: q.id,
    question: q.question_text,
    answer: q.answer_text,
    pageNumber: q.page_number,
  }));

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Study Questions
            </h1>
            <p className="text-muted-foreground mt-2">
              {questions.length} questions
            </p>
          </div>
          <ResetUploadButton></ResetUploadButton>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <QuestionCard key={idx} question={q} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
