"use client";

import { useState } from "react";
import { StudyQuestion } from "@/src/types";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { setCompletedAction } from "@/src/app/actions";
import { parseMarkdown } from "@/src/lib/markdown";

export default function StudyClient({
  questions: initialQuestions,
}: {
  questions: StudyQuestion[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | "initial">("initial");

  const currentQuestion = questions[currentIndex];

  const navigate = (dir: -1 | 1) => {
    setDirection(dir === 1 ? "next" : "prev");
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + dir + questions.length) % questions.length);
  };

  const handleKnow = async (knows: boolean) => {
    // Optimistic update
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === currentIndex ? { ...q, completed: knows } : q
      )
    );

    try {
      await setCompletedAction(currentQuestion.id, knows);
    } catch (error) {
      // Revert on error
      setQuestions((prev) =>
        prev.map((q, i) =>
          i === currentIndex ? { ...q, completed: !knows } : q
        )
      );
      console.error("Failed to update:", error);
    }

    // Auto-advance to next card
    if (currentIndex < questions.length - 1) {
      setTimeout(() => navigate(1), 300);
    }
  };

  const completedCount = questions.filter((q) => q.completed).length;

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-5xl px-6">
      {/* Progress */}
      <div className="text-sm text-muted-foreground">
        {completedCount} / {questions.length} known
      </div>

      {/* Flashcard with horizontal navigation */}
      <div className="flex items-center gap-6 w-full">
        {/* Left arrow */}
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft size={40} />
        </button>

        {/* Card */}
        <div
          className={`flex-1 h-[500px] perspective-distant cursor-pointer ${
            direction === "next" ? "animate-slide-in-right" : direction === "prev" ? "animate-slide-in-left" : ""
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
          key={currentQuestion.id}
        >
          <div
            className={`relative w-full h-full transition-all duration-500 transform-3d ${
              isFlipped ? "-rotate-y-180" : ""
            }`}
          >
            {/* Back - Answer (rendered first, rotated 180deg) */}
            <div className="absolute inset-0 backface-hidden rotate-x-0 rotate-y-180 bg-muted rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground mb-4">Answer</div>
              <div className="text-3xl font-medium text-center text-foreground whitespace-pre-wrap">
                {parseMarkdown(currentQuestion.answer)}
              </div>
            </div>

            {/* Front - Question (rendered last, no rotation) */}
            <div className="absolute inset-0 backface-hidden rotate-x-0 bg-muted rounded-2xl shadow-lg p-12 flex flex-col items-center justify-center">
              <div className="text-sm text-muted-foreground mb-4">
                Question {currentIndex + 1}
              </div>
              <div className="text-3xl font-medium text-center text-foreground whitespace-pre-wrap">
                {parseMarkdown(currentQuestion.question)}
              </div>
              <div className="mt-8 text-sm text-muted-foreground">
                Click to reveal answer
              </div>
            </div>
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => navigate(1)}
          className="p-3 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronRight size={40} />
        </button>
      </div>

      {/* Check / X buttons */}
      <div className="flex gap-8">
        <button
          onClick={() => handleKnow(false)}
          className={`p-4 rounded-full transition-all duration-200 ${
            currentQuestion.completed === false
              ? "bg-red-500/20 text-red-500"
              : "hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
          }`}
        >
          <X size={40} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => handleKnow(true)}
          className={`p-4 rounded-full transition-all duration-200 ${
            currentQuestion.completed === true
              ? "bg-green-500/20 text-green-500"
              : "hover:bg-green-500/10 text-muted-foreground hover:text-green-500"
          }`}
        >
          <Check size={40} strokeWidth={2.5} />
        </button>
      </div>

      {/* Card counter */}
      <div className="text-sm text-muted-foreground">
        {currentIndex + 1} / {questions.length}
      </div>
    </div>
  );
}
