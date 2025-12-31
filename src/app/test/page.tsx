"use client";
import Link from "next/link";
import { StudyQuestion } from "@/src/types";
import { useState } from "react";

export default function TestPage() {
  const [isFlipped, setIsFlipped] = useState(false);
  const questions: StudyQuestion[] = [
    {
      id: "dummy-1",
      question: "What is the capital of France?",
      answer: "Paris",
      pageNumber: 1,
      completed: false,
    },
    // {
    //   id: "dummy-2",
    //   question: "What is 2 + 2?",
    //   answer: "4",
    //   pageNumber: 1,
    //   completed: false,
    // },
    // {
    //   id: "dummy-3",
    //   question: "Explain the concept of photosynthesis.",
    //   answer:
    //     "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. In this process, carbon dioxide and water are converted into glucose and oxygen.",
    //   pageNumber: 2,
    //   completed: false,
    // },
    // {
    //   id: "dummy-4",
    //   question: "Who wrote 'To Kill a Mockingbird'?",
    //   answer: "Harper Lee",
    //   pageNumber: 3,
    //   completed: false,
    // },
    // {
    //   id: "dummy-5",
    //   question: "What is the chemical symbol for gold?",
    //   answer: "Au",
    //   pageNumber: 5,
    //   completed: false,
    // },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Study Questions (TEST MODE)
            </h1>
            <p className="text-muted-foreground mt-2">
              {questions.length} dummy questions for UI testing
            </p>
          </div>
          <Link
            href="/"
            className="border border-border px-6 py-2 rounded-lg font-medium hover:bg-muted-hover"
          >
            Back Home
          </Link>
        </div>
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className={`bg-muted rounded-lg shadow p-2 cursor-pointer transition duration-600 transform origin-center   ${isFlipped ? "rotate-y-180" : ""}`}
              key={q.id}
            >
              <div className="flex flex-col space-y-2 py-28 items-center justify-center h-full ">
                <div className="font-bold text-4xl backface-hidden">
                  {isFlipped ? q.answer : q.question}
                </div>
                <div className="text-2xl text-secondary font-light">
                  Page {q.pageNumber}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-900 text-yellow-200 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> In test mode, edits and status changes will
            not persist because they attempt to call the Supabase API, which may
            fail if you are offline.
          </p>
        </div>
      </div>
    </div>
  );
}
