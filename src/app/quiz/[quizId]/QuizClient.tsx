"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

export default function QuizClient({ answer }: { answer: string }) {
  const [answerVisible, setAnswerVisible] = useState<boolean>(false);

  return (
    <>
      {!answerVisible ? (
        <Eye
          strokeWidth={1.25}
          onClick={() => setAnswerVisible(true)}
          className="size-14 mx-auto cursor-pointer hover:opacity-70 transition duration-100"
        />
      ) : (
        <div className="bg-muted rounded px-6 py-3 h-14 overflow-y-auto text-xl text-foreground animate-fade-slide-in border border-border">
          {answer}
        </div>
      )}
    </>
  );
}
