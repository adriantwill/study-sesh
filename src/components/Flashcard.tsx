import { useState } from "react";
import { StudyQuestion } from "../types";

function Card({ text, subtext }: { text: string; subtext?: string }) {
  return (
    <div
      className={`absolute inset-0 w-full h-full bg-muted rounded-xl shadow-lg flex flex-col items-center justify-center p-8 backface-hidden ${
        !subtext ? "rotate-y-180 " : ""
      }`}
    >
      {subtext && (
        <div className="text-xs text-muted-foreground absolute top-4 left-4">
          {subtext}
        </div>
      )}
      <div className="text-3xl font-medium text-center text-foreground">
        {text}
      </div>
    </div>
  );
}

export default function Flashcard({
  q,
  direction,
}: {
  q: StudyQuestion;
  direction: "next" | "prev" | "initial";
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Determine animation class based on direction
  const animationClass =
    direction === "next"
      ? "animate-slide-in-right"
      : direction === "prev"
        ? "animate-slide-in-left"
        : "animate-slide-in-right"; // Default/Initial

  return (
    <div
      className={`group w-full h-80 perspective-distant cursor-pointer ${animationClass}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`group-has-[.header:hover]:translate-x-2 group-has-[.footer:hover]:-translate-x-2 relative w-full h-full transition-all duration-500 transform-3d ${isFlipped ? "-rotate-y-180" : "hover:-rotate-y-6"}`}
      >
        {/* Back (Answer) - Rendered first but rotated 180deg */}
        <Card text={q.answer} />

        {/* Front (Question) - Rendered last so it sits on top, no rotation */}
        <Card text={q.question} subtext={`Page ${q.pageNumber}`} />
      </div>
    </div>
  );
}
