import { StudyQuestion } from "../../api/generate-questions/route";
import { createClient } from "../../../lib/supabase/client";
import ResetUploadButton from "@/src/components/ResetUploadButton";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const supabase = createClient();
  const param = await params;
  const { data: supabaseQuestions, error } = await supabase
    .from("questions")
    .select("*")
    .eq("upload_id", param.reviewId);

  if (error) {
    console.error("Error fetching questions:", error);
    return;
  }

  const questions: StudyQuestion[] = supabaseQuestions.map((q) => ({
    question: q.question_text,
    answer: q.answer_text,
    pageNumber: q.page_number,
    slideContext: q.context,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white">
              Study Questions
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {questions.length} questions generated
            </p>
          </div>
          <div className="flex gap-3">
            <ResetUploadButton></ResetUploadButton>
          </div>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
                    Page {q.pageNumber}
                  </div>
                  <div className="font-medium text-black dark:text-white mb-3">
                    {q.question}
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white">
                      Show answer
                    </summary>
                    <div className="mt-2 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300">
                      {q.answer}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
