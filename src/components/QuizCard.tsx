"use client";
import { ChevronUp, ChevronDown } from "lucide-react";
import { StudyQuestion } from "../types";
import { useState } from "react";

interface QuizCardProps {
  questions: StudyQuestion[];
}

export default function QuizCard({ questions }: QuizCardProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [text, setText] = useState("");
  const [direction, setDirection] = useState<"up" | "down" | "initial">(
    "initial",
  );

  const handleNext = () => {
    setDirection("up");
    setCurrentQuestion((prev) => (prev + 1) % questions.length);
  };

  const handlePrev = () => {
    setDirection("down");
    setCurrentQuestion(
      (prev) => (prev - 1 + questions.length) % questions.length,
    );
  };

  const animationClass =
    direction === "up"
      ? "animate-scroll-up"
      : direction === "down"
        ? "animate-scroll-down"
        : "";

  return (
    <div className="flex flex-col items-center justify-around flex-1">
      <ChevronUp
        onClick={handlePrev}
        className="cursor-pointer size-12 hover:scale-125  duration-500"
      />
      <div
        key={currentQuestion}
        className={`px-12 py-6 w-full aspect-5/3 rounded bg-muted flex flex-col ${animationClass}`}
      >
        <div className="text-sm text-muted-foreground ">
          Slide {questions[currentQuestion].pageNumber}
        </div>
        <div className="flex flex-col justify-center space-y-24 flex-1">
          <div className="text-3xl font-medium text-center text-foreground">
            {questions[currentQuestion].question}
          </div>
          <textarea
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            className={`w-full text-3xl px-6 py-3 font-medium text-foreground bg-muted-hover rounded resize-none border-none outline-none`}
            autoFocus
          />
        </div>
        <div className="text-sm font-medium text-muted-foreground items-center justify-center flex">
          {currentQuestion + 1} / {questions.length}
        </div>
      </div>
      <ChevronDown
        onClick={handleNext}
        className="cursor-pointer size-12 hover:scale-125  duration-500"
      />
    </div>
  );
}
