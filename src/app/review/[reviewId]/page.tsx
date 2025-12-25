import { createClient } from "../../../lib/supabase/server";
import EditableField from "@/src/components/EditableField";
import Link from "next/link";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const supabase = await createClient();
  const param = await params;
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("upload_id", param.reviewId)
    .order("page_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching questions:", error);
    throw new Error("Failed to load questions");
  }

  if (!data) {
    throw new Error("No questions found");
  }

  const questions = data.map((q) => ({
    id: q.id,
    question: q.question_text,
    answer: q.answer_text,
    pageNumber: q.page_number,
    completed: q.completed,
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
          <Link
            href="/"
            className="border border-border px-6 py-2 rounded-lg font-medium hover:bg-muted-hover"
          >
            New Upload
          </Link>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div className="bg-muted rounded-lg shadow p-6" key={q.id}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-2">
                    Page {q.pageNumber}
                  </div>
                  <EditableField question={q} variant="question" />

                  <details className="text-sm mt-4">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show answer
                    </summary>
                    <div className="mt-2 p-4 rounded-lg bg-muted-hover">
                      <EditableField question={q} variant="answer" />
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
