import { createClient } from "../../../lib/supabase/server";
import FlashcardView from "@/src/components/FlashcardView";
import { StudyQuestion } from "@/src/types";
import EditField from "@/src/components/EditField";
import DeleteButton from "@/src/components/DeleteButton";
import { SquareCheck } from "lucide-react";
import { toggleCompleteAction } from "../../actions";

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

  const questions: StudyQuestion[] = data.map((q) => ({
    id: q.id,
    question: q.question_text,
    answer: q.answer_text,
    pageNumber: q.page_number,
    completed: q.completed,
  }));
  //TODO fix supabase RLS
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl space-y-10 mx-auto">
        <div className="flex justify-between items-center ">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Study Sesh</h1>
          </div>
        </div>

        <FlashcardView questions={questions} />
        <div className="h-px opacity-40 bg-foreground"></div>
        <div className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">
            Question Bank
          </h2>
          {questions.map((q, idx) => {
            const toggleCompleteParams = toggleCompleteAction.bind(
              null,
              q.id,
              q.completed,
            );

            return (
              <div className="bg-muted rounded-lg shadow p-6" key={q.id}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-2">
                      Page {q.pageNumber}
                    </div>
                    <div
                      className={`flex items-center justify-between  ? "font-medium text-foreground mb-3" ${q.completed ? "line-through opacity-70" : ""}`}
                    >
                      <EditField
                        id={q.id}
                        variant={"question_text"}
                        textField={q.question}
                      />
                      <form
                        action={toggleCompleteParams}
                        className="flex items-center"
                      >
                        <button
                          aria-label="Mark as complete"
                          className="flex items-center justify-center"
                        >
                          <SquareCheck
                            size={16}
                            className={q.completed ? "text-success" : ""}
                          />
                        </button>
                      </form>

                      <DeleteButton id={q.id} variant="question" />
                    </div>
                    {!q.completed && (
                      <details className="text-sm mt-4">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Show answer
                        </summary>
                        <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                          <EditField
                            variant={"answer_text"}
                            textField={q.answer}
                            id={q.id}
                          />
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
