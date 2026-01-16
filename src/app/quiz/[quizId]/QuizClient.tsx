"use client";

import { BookKey, BookLock } from "lucide-react";
import { useState } from "react";
import { parseMarkdown } from "@/src/lib/markdown";

export default function QuizClient({ answer }: { answer: string }) {
  const [answerVisible, setAnswerVisible] = useState<boolean>(false);

  return (
    <>
      {!answerVisible ? (
        <BookKey
          strokeWidth={1.25}
          onClick={() => setAnswerVisible(true)}
          className="size-13.5 mx-auto cursor-pointer hover:opacity-70 transition-opacity duration-100 animate-fade-slide-in"
          onAnimationEnd={(e) =>
            e.currentTarget.classList.remove("animate-fade-slide-in")
          }
        />
      ) : (
        <div className="flex justify-between text-xl text-foreground px-4 items-center animate-fade-slide-in border border-border gap-3">
          <div className="bg-muted w-full overflow-y-visible rounded py-3 whitespace-pre-wrap">
            {parseMarkdown(answer)}
          </div>
          <BookLock
            strokeWidth={1.25}
            className=" size-10 cursor-pointer hover:opacity-70 transition duration-100"
            onClick={() => setAnswerVisible(false)}
          />
        </div>
      )}
    </>
  );
}
