"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
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
  const [actionHistory, setActionHistory] = useState<Array<{
    type: "complete" | "skip";
    id: string;
    prevIndex: number;
  }>>([]);

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
  const [isFlipped, setIsFlipped] = useState(false);

  const changeDirection = (dir: -1 | 1) => {
    setDirection(dir === 1 ? "next" : "prev");
    setCurrentIndex(
      (prev) =>
        (prev + dir + filteredQuestions.length) % filteredQuestions.length,
    );
  };

  const handleComplete = () => {
    const id = filteredQuestions[currentIndex].id;
    setActionHistory((prev) => [
      ...prev,
      { type: "complete", id, prevIndex: currentIndex },
    ]);
    setItem(id, true);
    setCompletedIds((prev) => [...prev, id]);
    if (currentIndex >= filteredQuestions.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleSkip = () => {
    const id = filteredQuestions[currentIndex].id;
    setActionHistory((prev) => [
      ...prev,
      { type: "skip", id, prevIndex: currentIndex },
    ]);
    changeDirection(1);
  };

  const handleUndo = () => {
    const lastAction = actionHistory.at(-1);
    if (!lastAction) return;

    if (lastAction.type === "complete") {
      removeItem(lastAction.id);
      setCompletedIds((prev) => {
        const nextCompletedIds = prev.filter((id) => id !== lastAction.id);
        const nextFilteredQuestions = questions.filter(
          (q) => !nextCompletedIds.includes(q.id),
        );
        const targetIndex = nextFilteredQuestions.findIndex(
          (q) => q.id === lastAction.id,
        );
        setCurrentIndex(targetIndex === -1 ? 0 : targetIndex);
        return nextCompletedIds;
      });
      setActionHistory((prev) => prev.slice(0, -1));
      return;
    } else {
      const targetIndex = Math.max(
        0,
        Math.min(lastAction.prevIndex, filteredQuestions.length - 1),
      );
      setCurrentIndex(targetIndex);
      setActionHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleReset = () => {
    for (const id of completedIds) {
      removeItem(id);
    }
    setCompletedIds([]);
    setCurrentIndex(0);
    setActionHistory([]);
  };

  // Determine animation class based on direction
  const animationClass =
    direction === "next"
      ? "animate-slide-in-right"
      : direction === "prev"
        ? "animate-slide-in-left"
        : "animate-slide-in-right"; // Default/Initial

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
    <div
      className="mx-auto"
      role="listbox"
      tabIndex={0}
      onKeyDown={(e) => {
        const focusTarget = e.currentTarget;

        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          setIsFlipped(!isFlipped);
          return;
        }
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

        e.preventDefault();
        if (isStudyMode) {
          if (e.key === "ArrowRight") handleSkip();
          else handleComplete();
        } else {
          changeDirection(e.key === "ArrowRight" ? 1 : -1);
        }
        requestAnimationFrame(() => {
          focusTarget.focus();
        });
      }}
    >
      <div className="flex gap-4 transition-transform duration-300 ease-out peer-hover/prev:-translate-x-2 peer-hover/next:translate-x-2">
        {!isStudyMode && (
          <NavigationButton
            direction="prev"
            changeDirection={changeDirection}
          />
        )}
        <button
          key={`${filteredQuestions[currentIndex].id}-${direction}`}
          type="button"
          className={`group w-full ${height} perspective-distant cursor-pointer ${animationClass}`}
          onClick={() => {
            setIsFlipped(!isFlipped);
          }}
        >
          <div
            className={`group-has-[.header:hover]:translate-x-2 group-has-[.footer:hover]:-translate-x-2 relative w-full h-full transition-all duration-500 transform-3d ${isFlipped ? "-rotate-y-180" : "hover:-rotate-y-6"} `}
          >
            <Flashcard text={filteredQuestions[currentIndex].answer} isBack />
            <Flashcard text={filteredQuestions[currentIndex].question} imageUrl={filteredQuestions[currentIndex].imageUrl} />
          </div>
        </button>
        {!isStudyMode && (
          <NavigationButton
            direction="next"
            changeDirection={changeDirection}
          />
        )}
      </div>
      <div className="mt-4 flex flex-col items-center">
        <div
          className={`font-medium ${isStudyMode ? "text-xl" : "text-sm text-muted-foreground"}`}
        >
          {isStudyMode
            ? `${completedIds.length} Known | ${questions.length - completedIds.length} Unknown`
            : `${currentIndex + 1} / ${filteredQuestions.length}`}
        </div>
        {isStudyMode && (
          <div className="text-sm text-muted-foreground mt-1">
            {filteredQuestions.length - currentIndex} Cards left
          </div>
        )}
      </div>
      {isStudyMode && (
        <>
          <div className="justify-center flex gap-4 mt-10">
            {[0, 1].map((index) => {
              const Icon = index === 0 ? Check : X;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={index === 0 ? handleComplete : handleSkip}
                  className={`text-muted-foreground p-4 rounded-full transition-all duration-200 ${index === 0
                    ? "hover:bg-green-500/10 hover:text-green-500"
                    : "hover:bg-red-500/10 hover:text-red-500"
                    }`}
                >
                  <Icon size={40} strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
          <div className="text-sm text-muted-foreground hover:text-foreground underline flex justify-center mt-6 gap-6">
            {(completedIds.length > 0 || actionHistory.length > 0) && (
              <button
                type="button"
                onClick={actionHistory.length > 0 ? handleUndo : handleReset}
              >
                {actionHistory.length > 0 ? "Undo" : "Reset progress"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
