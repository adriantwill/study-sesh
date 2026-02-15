"use client";

import { useState } from "react";
import MultipleChoice from "./MultipleChoice";

interface QuizChoicesProps {
  choices: string[];
  answer: string;
}

export default function QuizChoices({ choices, answer }: QuizChoicesProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const revealResult = selectedIdx !== null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {choices.map((choice, idx) => (
        <MultipleChoice
          key={`${idx}-${choice}`}
          choice={choice}
          correct={choice === answer}
          selected={selectedIdx === idx}
          revealResult={revealResult}
          onSelect={() => setSelectedIdx(idx)}
        />
      ))}
    </div>
  );
}
