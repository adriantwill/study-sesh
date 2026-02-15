import QuizCard from "@/src/components/QuizCard";
import { parseMarkdown } from "@/src/lib/markdown";
import { createClient } from "@/src/lib/supabase/server";

function shuffleArray(items: string[]): string[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("upload_id", quizId)
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
              <div className="grid grid-cols-2 gap-3">
                {q.choices.map((choice, choiceIdx) => (
                  <div
                    key={`${q.id}-${choiceIdx}`}
                    className="bg-muted w-full overflow-y-visible rounded py-3 whitespace-pre-wrap flex justify-between text-xl text-foreground px-4 items-center animate-fade-slide-in border border-border gap-3"
                  >
                    {parseMarkdown(choice)}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <QuizCard />
        </div>
      ))}
    </div>
  );
}
