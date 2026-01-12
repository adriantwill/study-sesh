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
          className="size-13.5 mx-auto cursor-pointer hover:opacity-70 transition-opacity duration-100 animate-fade-slide-in"
          onAnimationEnd={(e) =>
            e.currentTarget.classList.remove("animate-fade-slide-in")
          }
        />
      ) : (
        <div className="flex justify-between text-xl text-foreground px-6 items-center animate-fade-slide-in border border-border gap-3">
          <div className="bg-muted w-full overflow-y-visible rounded  py-3  ">
            {answer}
          </div>
          <Eye
            strokeWidth={1.25}
            className=" size-10 cursor-pointer hover:opacity-70 transition duration-100"
            onClick={() => setAnswerVisible(false)}
          />
        </div>
      )}
    </>
  );
}
