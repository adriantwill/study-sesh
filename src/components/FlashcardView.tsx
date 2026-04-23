"use client";

import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import Flashcard from "@/src/components/Flashcard";
import type { StudyQuestion } from "@/src/types";
import { shuffleArray } from "../utils/cards";
import { getItem, removeItem, setItem } from "../utils/localStorage";
import NavigationButton from "./NavigationButton";
import StudyProgress from "./StudyProgress";

export default function FlashcardView({
  questions: initialQuestions,
  height,
}: {
  questions: StudyQuestion[];
  height?: string;
}) {
  const isStudyMode = height === "h-130";
  const [questions, setQuestions] = useState(initialQuestions);
  const [actionHistory, setActionHistory] = useState<
    Array<{
      type: "complete" | "skip";
      id: string;
      prevIndex: number;
    }>
  >([]);

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
    setIsFlipped(false);
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
    setIsFlipped(false);
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
    }

    const targetIndex = Math.max(
      0,
      Math.min(lastAction.prevIndex, filteredQuestions.length - 1),
    );
    setCurrentIndex(targetIndex);
    setActionHistory((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    for (const id of completedIds) {
      removeItem(id);
    }
    setCompletedIds([]);
    setCurrentIndex(0);
    setActionHistory([]);
  };

  const animationClass =
    direction === "next"
      ? "animate-slide-in-right"
      : direction === "prev"
        ? "animate-slide-in-left"
        : "animate-slide-in-right";

  if (filteredQuestions.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-muted-foreground">All questions completed!</p>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Reset progress
        </button>
      </div>
    );
  }

  return (
    <div
      className="mx-auto space-y-20 focus:outline-none focus-visible:outline-none"
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
      {isStudyMode && (
        <StudyProgress
          completedCount={completedIds.length}
          totalCount={questions.length}
          cardsLeft={filteredQuestions.length - currentIndex}
        />
      )}
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
            className={`group-has-[.header:hover]:translate-x-2 group-has-[.footer:hover]:-translate-x-2 relative h-full w-full transition-all duration-500 transform-3d ${isFlipped ? "-rotate-y-180" : "hover:-rotate-y-6"} `}
          >
            <Flashcard text={filteredQuestions[currentIndex].answer} isBack />
            <Flashcard
              text={filteredQuestions[currentIndex].question}
              imageUrl={filteredQuestions[currentIndex].imageUrl}
            />
          </div>
        </button>
        {!isStudyMode && (
          <NavigationButton
            direction="next"
            changeDirection={changeDirection}
          />
        )}
      </div>
      {!isStudyMode && (
        <div className="mt-4 flex flex-col items-center">
          <div className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1} / {filteredQuestions.length}
          </div>
        </div>
      )}
      {isStudyMode && (
        <div>
          <div className="flex justify-center gap-4">
            {[0, 1].map((index) => {
              const Icon = index === 0 ? Check : X;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={index === 0 ? handleComplete : handleSkip}
                  className={`rounded-full p-4 text-muted-foreground transition-all duration-200 ${index === 0
                    ? "hover:bg-primary/10 hover:text-primary"
                    : "hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <Icon size={40} strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
          <div className="mt flex justify-center gap-6 text-sm text-muted-foreground underline hover:text-foreground">
            {completedIds.length > 0 || actionHistory.length > 0 ? (
              <button
                type="button"
                onClick={actionHistory.length > 0 ? handleUndo : handleReset}
              >
                {actionHistory.length > 0 ? "Undo" : "Reset progress"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setQuestions(shuffleArray(questions))}
              >
                Shuffle Deck
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
