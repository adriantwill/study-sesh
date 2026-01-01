"use client";
import Link from "next/link";
import { StudyQuestion } from "@/src/types";
import { useState } from "react";
import Flashcard from "@/src/components/Flashcard";

export default function TestPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev" | "initial">(
    "initial",
  );

  const questions: StudyQuestion[] = [
    {
      id: "dummy-1",
      question: "What is the capital of France?",
      answer: "Paris",
      pageNumber: 1,
      completed: false,
    },
    {
      id: "dummy-2",
      question: "What is 2 + 2?",
      answer: "4",
      pageNumber: 1,
      completed: false,
    },
    {
      id: "dummy-3",
      question: "Explain the concept of photosynthesis.",
      answer:
        "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. In this process, carbon dioxide and water are converted into glucose and oxygen.",
      pageNumber: 2,
      completed: false,
    },
    {
      id: "dummy-4",
      question: "Who wrote 'To Kill a Mockingbird'?",
      answer: "Harper Lee",
      pageNumber: 3,
      completed: false,
    },
    {
      id: "dummy-5",
      question: "What is the chemical symbol for gold?",
      answer: "Au",
      pageNumber: 5,
      completed: false,
    },
  ];

  const nextCard = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % questions.length);
  };

  const prevCard = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Flashcards</h1>
            <p className="text-muted-foreground mt-2">Test your knowledge</p>
          </div>
          <Link
            href="/"
            className="border border-border px-6 py-2 rounded-lg font-medium hover:bg-muted-hover transition-colors"
          >
            Back Home
          </Link>
        </div>

        <div className="relative group ">
          <Flashcard
            key={questions[currentIndex].id}
            q={questions[currentIndex]}
            direction={direction}
          />

          <div className="flex justify-between items-center mt-5">
            <button
              onClick={prevCard}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors header"
            >
              ←
            </button>
            <div className="text-sm font-medium text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </div>
            <button
              onClick={nextCard}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors footer"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
