import { createClient } from "../../../lib/supabase/server";
import Image from "next/image";
import FlashcardView from "@/src/components/FlashcardView";
import { StudyQuestion } from "@/src/types";
import EditField from "@/src/components/EditField";
import DeleteButton from "@/src/components/DeleteButton";
import { SquareCheck } from "lucide-react";
import { toggleCompleteAction } from "../../actions";
import Link from "next/link";
import AddQuestionButton from "@/src/components/AddQuestionButton";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  let title = "Test title";
  let questions: StudyQuestion[] = [
    {
      id: "mock-1",
      question: "What is the capital of France?",
      answer: "Paris",
      pageNumber: 1,
      completed: true,
    },
    {
      id: "mock-2",
      question: "What is the powerhouse of the cell?",
      answer: "Mitochondria",
      pageNumber: 1,
      completed: false,
    },
    {
      id: "mock-3",
      question: "Explain the concept of photosynthesis.",
      answer:
        "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.",
      pageNumber: 2,
      completed: false,
    },
    {
      id: "mock-4",
      question: "Who wrote 'To Kill a Mockingbird'?",
      answer: "Harper Lee",
      pageNumber: 3,
      completed: false,
    },
  ];
  if (process.env.MOCK_AI !== "true") {
    const supabase = await createClient();
    const param = await params;
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("upload_id", param.reviewId)
      .order("page_number", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

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
      .eq("id", param.reviewId)
      .single();

    if (titleError) {
      console.error("Error fetching title:", titleError);
      throw new Error("Failed to load title");
    }

    questions = data.map((q) => ({
      id: q.id,
      question: q.question_text,
      answer: q.answer_text,
      pageNumber: q.page_number,
      completed: q.completed,
      imageUrl: q.image_url,
    }));
    title = studyTitle.filename;
  }
  //TODO fix supabase RLS
  const reviewId = (await params).reviewId;
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl space-y-10 mx-auto">
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <Link
            href={`/quiz/${(await params).reviewId}`}
            className="text-2xl text-primary hover:text-secondary"
          >
            Quiz
          </Link>
        </div>

        <FlashcardView questions={questions} />
        <div className="h-px opacity-40 bg-foreground"></div>
        <div className="space-y-4">
          <h2 className="text-2xl items-center flex justify-between font-medium text-foreground">
            Question Bank
            <AddQuestionButton uploadId={reviewId} />
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
                        variant={"question_text"}
                        textField={q.question}
                        id={q.id}
                        completed={q.completed}
                      />
                      <form
                        action={toggleCompleteParams}
                        className="flex items-center"
                      >
                        <button
                          aria-label="Mark as complete"
                          className="flex items-center justify-center cursor-pointer hover:text-secondary"
                        >
                          <SquareCheck size={16} />
                        </button>
                      </form>

                      <DeleteButton
                        id={q.id}
                        variant="question"
                        completed={q.completed}
                      />
                    </div>
                    {q.imageUrl && !q.completed && (
                      <Image
                        src={q.imageUrl}
                        alt="supporting image"
                        width={500}
                        height={500}
                        className="mt-3 rounded-md border border-muted-foreground/20"
                      />
                    )}
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
                            completed={q.completed}
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
