import { useState } from "react";
import { StudyQuestion } from "../types";
import { parseMarkdown } from "../lib/markdown";

function Card({ text, isBack }: { text: string; isBack?: boolean }) {
  return (
    <div
      className={`text-4xl font-medium text-center text-foreground whitespace-pre-wrap absolute inset-0 w-full h-full bg-muted rounded-xl shadow-lg flex flex-col items-center justify-center p-8 backface-hidden rotate-x-0 ${isBack ? "rotate-y-180 " : ""}`}
    >
      {parseMarkdown(text)}
    </div>
  );
}

export default function Flashcard({
  q,
  direction,
  height = "h-104",
}: {
  q: StudyQuestion;
  direction: "next" | "prev" | "initial";
  height?: string;
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
      className={`group w-full ${height} perspective-distant cursor-pointer ${animationClass}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`group-has-[.header:hover]:translate-x-2 group-has-[.footer:hover]:-translate-x-2 relative w-full h-full transition-all duration-500 transform-3d ${isFlipped ? "-rotate-y-180" : "hover:-rotate-y-6"} `}
      >
        {/* Back (Answer) - Rendered first but rotated 180deg */}
        <Card text={q.answer} isBack />

        {/* Front (Question) - Rendered last so it sits on top, no rotation */}
        <Card text={q.question} />
      </div>
    </div>
  );
}
