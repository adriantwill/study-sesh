
import QuizCard from "@/src/components/QuizCard";
import QuizChoices from "@/src/components/QuizChoices";
import { parseMarkdown } from "@/src/lib/markdown";
import { createClient } from "@/src/lib/supabase/server";
import { shuffleArray } from "@/src/utils/cards";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("id, upload_id, question_text, answer_text, image_url, display_order, options")
    .eq("upload_id", quizId)
    .eq("deleted", false)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Error fetching questions:", error);
    throw new Error("Failed to load questions");
  }

  if (!data) {
    throw new Error("No questions found");
  }

  const questions = data.map((q) => ({
    id: q.id,
    upload_id: q.upload_id ?? quizId,
    question: q.question_text,
    answer: q.answer_text,
    imageUrl: q.image_url,
    choices: shuffleArray([...(q.options ?? []), q.answer_text]).slice(0, 4),
  }));
  return (
    <div className="max-w-5xl mx-auto">
      {questions.map((q, i) => (
        <div
          key={q.id}
          className="h-screen snap-start my-auto px-6 flex flex-col items-center justify-center"
        >
          <div className="px-12 py-6 w-full h-145 rounded-lg shadow bg-muted flex flex-col ">
            <div className="text-muted-foreground">Question {i + 1}</div>
            <div className="flex flex-col justify-center space-y-24 flex-1">
              <div className="text-3xl font-medium text-center text-foreground whitespace-pre-wrap">
                {parseMarkdown(q.question)}
              </div>
              <QuizChoices choices={q.choices} answer={q.answer} />
            </div>
          </div>
          <QuizCard />
        </div>
      ))}
    </div>
  );
}
