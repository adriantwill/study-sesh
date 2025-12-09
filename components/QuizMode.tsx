'use client';

import { useState } from 'react';
import { StudyQuestion } from '@/app/api/generate-questions/route';

interface QuizModeProps {
  questions: StudyQuestion[];
  onBack: () => void;
  onReset: () => void;
}

export default function QuizMode({ questions, onBack, onReset }: QuizModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState<
    Record<number, string>
  >({});

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (userAnswer.trim()) {
      setAnsweredQuestions((prev) => ({
        ...prev,
        [currentIndex]: userAnswer,
      }));
    }

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
      setUserAnswer(answeredQuestions[currentIndex + 1] || '');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowAnswer(false);
      setUserAnswer(answeredQuestions[currentIndex - 1] || '');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Quiz Mode
            </h1>
            <div className="flex gap-2">
              <button
                onClick={onBack}
                className="text-sm border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Back to Review
              </button>
              <button
                onClick={onReset}
                className="text-sm border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                New Upload
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-black dark:bg-white transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
            Page {currentQuestion.pageNumber}
            {currentQuestion.slideContext && ` • ${currentQuestion.slideContext}`}
          </div>

          <h2 className="text-2xl font-semibold text-black dark:text-white mb-6">
            {currentQuestion.question}
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Your Answer:
            </label>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 p-4 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-black dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {showAnswer && (
            <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Correct Answer:
              </div>
              <div className="text-zinc-900 dark:text-zinc-100">
                {currentQuestion.answer}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex-1 px-6 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>

            <button
              onClick={handleNext}
              disabled={isLastQuestion}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
