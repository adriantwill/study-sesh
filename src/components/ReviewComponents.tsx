import { StudyQuestion } from "../app/api/generate-questions/route";

interface ReviewModeProps {
  questions: StudyQuestion[];
  onStartQuiz: () => void;
  onReset: () => void;
}

export default function ReviewMode({
  questions,
  onStartQuiz,
  onReset,
}: ReviewModeProps) {
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
            <button
              onClick={onStartQuiz}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
              Start Quiz
            </button>
            <button
              onClick={onReset}
              className="border border-zinc-300 dark:border-zinc-700 px-6 py-2 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              New Upload
            </button>
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
