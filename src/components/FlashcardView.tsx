"use client";

import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Flashcard from "@/src/components/Flashcard";
import type { StudyQuestion } from "@/src/types";
import { getItem, removeItem, setItem } from "../utils/localStorage";
import NavigationButton from "./NavigationButton";

export default function FlashcardView({
  questions,
  height,
}: {
  questions: StudyQuestion[];
  height?: string;
}) {
  const isStudyMode = height === "h-130";
  const [lastAction, setLastAction] = useState<
    | {
      type: "complete" | "skip";
      id: string;
      prevIndex: number;
    }
    | null
  >(null);

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    if (!isStudyMode) return [];
    return questions.filter((q) => getItem(q.id)).map((q) => q.id);
  });

  const filteredQuestions = useMemo(() => {
    if (!isStudyMode) return questions;
    return questions.filter((q) => !completedIds.includes(q.id));
  }, [questions, isStudyMode, completedIds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | "initial">(
    "initial",
  );

  const changeDirection = (dir: -1 | 1) => {
    setDirection(dir === 1 ? "next" : "prev");
    setCurrentIndex(
      (prev) =>
        (prev + dir + filteredQuestions.length) % filteredQuestions.length,
    );
  };

  const handleComplete = () => {
    const id = filteredQuestions[currentIndex].id;
    setLastAction({ type: "complete", id, prevIndex: currentIndex });
    setItem(id, true);
    setCompletedIds([...completedIds, id]);
    if (currentIndex >= filteredQuestions.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleSkip = () => {
    const id = filteredQuestions[currentIndex].id;
    setLastAction({ type: "skip", id, prevIndex: currentIndex });
    changeDirection(1);
  };

  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === "complete") {
      removeItem(lastAction.id);
      const nextCompletedIds = completedIds.filter((id) => id !== lastAction.id);
      setCompletedIds(nextCompletedIds);

      const nextFilteredQuestions = questions.filter(
        (q) => !nextCompletedIds.includes(q.id),
      );
      const targetIndex = nextFilteredQuestions.findIndex(
        (q) => q.id === lastAction.id,
      );

      setCurrentIndex(targetIndex === -1 ? 0 : targetIndex);
      setLastAction(null);
      return;
    } else {
      const targetIndex = Math.max(0, Math.min(lastAction.prevIndex, filteredQuestions.length - 1));
      setCurrentIndex(targetIndex);
      setLastAction(null);
    }
  };

  const handleReset = () => {
    for (const id of completedIds) {
      removeItem(id);
    }
    setCompletedIds([]);
    setCurrentIndex(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        if (isStudyMode) {
          handleSkip();
        } else {
          changeDirection(1);
        }
      }
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
          type="button"
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
          <NavigationButton
            direction="prev"
            changeDirection={changeDirection}
          />
        )}
        <Flashcard
          key={filteredQuestions[currentIndex].id}
          q={filteredQuestions[currentIndex]}
          direction={direction}
          height={height}
        />
        {!isStudyMode && (
          <NavigationButton
            direction="next"
            changeDirection={changeDirection}
          />
        )}
      </div>
      <div className="mt-4 flex justify-center">
        {!isStudyMode ? (
          <div className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {filteredQuestions.length}
          </div>
        ) : (
          <div className="text-xl font-medium ">
            {completedIds.length} Known | {questions.length - completedIds.length} Unknown
          </div>
        )}
      </div>
      {isStudyMode && (
        <>
          <div className="justify-center flex gap-4 mt-10">
            <button
              type="button"
              onClick={handleComplete}
              className="hover:bg-green-500/10 text-muted-foreground hover:text-green-500 p-4 rounded-full transition-all duration-200"
            >
              <Check size={40} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="hover:bg-red-500/10 text-muted-foreground hover:text-red-500 p-4 rounded-full transition-all duration-200"
            >
              <X size={40} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex justify-center mt-6 gap-6">
            {completedIds.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Reset progress
              </button>
            )}
            {lastAction && (
              <button
                type="button"
                onClick={handleUndo}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Undo
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
