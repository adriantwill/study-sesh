"use client";

import { useState } from "react";
import { parseMarkdown } from "../lib/markdown";

interface MultipleChoiceProps {
  choice: string;
  correct: boolean;
}

export default function MultipleChoice({ choice, correct }: MultipleChoiceProps) {
  const [result, setResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  function checkAnswer() {
    setAnswered(true);
    setResult(correct);
    console.log(correct ? "Correct!" : "Incorrect!");
  }

  return (
    <button
      type="button"
      onClick={checkAnswer}
      className={` bg-muted w-full overflow-y-visible rounded py-3 whitespace-pre-wrap flex justify-between text-xl text-foreground px-4 items-center border gap-3 transition ${answered ? "border-transparent" : "border-border"} choice-border-anim ${answered && result ? "choice-border-correct cursor-default" : "cursor-pointer"
        } ${answered && !result ? "choice-border-wrong cursor-default" : "cursor-pointer"}`}
    >
      {parseMarkdown(choice)}
    </button>
  );
}
