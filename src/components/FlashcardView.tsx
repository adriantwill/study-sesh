"use client";

import { useState } from "react";
import { StudyQuestion } from "@/src/types";
import Flashcard from "@/src/components/Flashcard";
import NavigationButton from "./NavigationButton";

export default function FlashcardView({
  questions,
}: {
  questions: StudyQuestion[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | "initial">(
    "initial",
  );

  const changeDirection = (direction: -1 | 1) => {
    setDirection(direction === 1 ? "next" : "prev");
    setCurrentIndex(
      (prev) => (prev + direction + questions.length) % questions.length,
    );
  };

  return (
    <div className=" mx-auto ">
      <div className="flex gap-4 transition-transform duration-300 ease-out peer-hover/prev:-translate-x-2 peer-hover/next:translate-x-2">
        <NavigationButton direction="prev" changeDirection={changeDirection} />
        <Flashcard
          key={questions[currentIndex].id}
          q={questions[currentIndex]}
          direction={direction}
        />
        <NavigationButton direction="next" changeDirection={changeDirection} />
      </div>
      <div className="text-sm font-medium text-muted-foreground flex justify-center">
        {currentIndex + 1} / {questions.length}
      </div>
    </div>
  );
}
