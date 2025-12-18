import { StudyQuestion } from "../../api/generate-questions/route";
import { LiaEditSolid } from "react-icons/lia";
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

  let questions: StudyQuestion[];

  if (error || !supabaseQuestions) {
    console.error("Error fetching questions, using dummy data:", error);
    questions = [
      {
        question: "What is the main topic of this slide?",
        answer: "This is dummy data for offline testing",
        pageNumber: 1,
        slideContext: "Dummy context",
      },
      {
        question: "What are the key points discussed?",
        answer: "Key points include A, B, and C",
        pageNumber: 1,
        slideContext: "Dummy context",
      },
      {
        question: "How does this concept apply?",
        answer: "It applies in various scenarios including X, Y, Z",
        pageNumber: 2,
        slideContext: "Dummy context",
      },
    ];
  } else {
    questions = supabaseQuestions.map((q) => ({
      question: q.question_text,
      answer: q.answer_text,
      pageNumber: q.page_number,
      slideContext: q.context,
    }));
  }

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
            <div key={idx} className="bg-muted rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between ">
                    <div className="text-xs text-muted-foreground mb-2">
                      Page {q.pageNumber}
                    </div>
                    <LiaEditSolid className="size-7 cursor-pointer hover:text-secondary" />
                  </div>
                  <div className="flex justify-between ">
                    <div className="font-medium text-foreground mb-3">
                      {q.question}
                    </div>
                    <div>{/*<LiaEditSolid className="size-8" />*/}</div>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show answer
                    </summary>
                    <div className="mt-2 p-4 rounded-lg bg-muted-hover text-foreground/90">
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
