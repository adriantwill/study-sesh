"use client";

import { useState, useMemo, useEffect } from "react";
import { StudyQuestion } from "@/src/types";
import Flashcard from "@/src/components/Flashcard";
import NavigationButton from "./NavigationButton";
import { X, Check } from "lucide-react";
import { setItem, getItem, removeItem } from "../utils/localStorage";

export default function FlashcardView({
  questions,
  height,
}: {
  questions: StudyQuestion[];
  height?: string;
}) {
  const isStudyMode = height === "h-130";

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    if (!isStudyMode) return [];
    return questions.filter((q) => getItem(q.id)).map((q) => q.id);
  });

  const filteredQuestions = useMemo(() => {
    if (!isStudyMode) return questions;
    return questions.filter((q) => !completedIds.includes(q.id));
  }, [questions, isStudyMode, completedIds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | "initial">("initial");

  const changeDirection = (dir: -1 | 1) => {
    setDirection(dir === 1 ? "next" : "prev");
    setCurrentIndex(
      (prev) => (prev + dir + filteredQuestions.length) % filteredQuestions.length,
    );
  };

  const handleComplete = () => {
    const id = filteredQuestions[currentIndex].id;
    setItem(id, true);
    setCompletedIds([...completedIds, id]);
    if (currentIndex >= filteredQuestions.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleReset = () => {
    completedIds.forEach((id) => removeItem(id));
    setCompletedIds([]);
    setCurrentIndex(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === "ArrowRight") changeDirection(1);
      if (isStudyMode) {
        if (e.key === "ArrowLeft") handleComplete();
      } else {
        if (e.key === "ArrowLeft") changeDirection(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (filteredQuestions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">All questions completed!</p>
        <button
          onClick={handleReset}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Reset progress
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="flex gap-4 transition-transform duration-300 ease-out peer-hover/prev:-translate-x-2 peer-hover/next:translate-x-2">
        {!isStudyMode && (
          <NavigationButton direction="prev" changeDirection={changeDirection} />
        )}
        <Flashcard
          key={filteredQuestions[currentIndex].id}
          q={filteredQuestions[currentIndex]}
          direction={direction}
          height={height}
        />
        {!isStudyMode && (
          <NavigationButton direction="next" changeDirection={changeDirection} />
        )}
      </div>
      <div className="mt-4 text-sm font-medium text-muted-foreground flex justify-center">
        {currentIndex + 1} / {filteredQuestions.length}
      </div>
      {isStudyMode && (
        <>
          <div className="justify-center flex gap-4 mt-10">
            <button
              onClick={handleComplete}
              className="hover:bg-green-500/10 text-muted-foreground hover:text-green-500 p-4 rounded-full transition-all duration-200"
            >
              <Check size={40} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => changeDirection(1)}
              className="hover:bg-red-500/10 text-muted-foreground hover:text-red-500 p-4 rounded-full transition-all duration-200"
            >
              <X size={40} strokeWidth={2.5} />
            </button>
          </div>
          {completedIds.length > 0 && (
            <div className="text-center mt-6">
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Reset progress
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
