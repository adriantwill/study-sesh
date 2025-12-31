import { NextResponse } from "next/server";
import { StudyQuestion } from "@/src/types";

export async function GET() {
  const dummyQuestions: StudyQuestion[] = [
    {
      id: "1",
      question: "What is the capital of France?",
      answer: "Paris",
      pageNumber: 1,
      completed: false,
    },
    {
      id: "2",
      question: "What is 2 + 2?",
      answer: "4",
      pageNumber: 1,
      completed: false,
    },
    {
      id: "3",
      question: "Explain the concept of photosynthesis.",
      answer: "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods with the help of chlorophyll pigments. In this process, carbon dioxide and water are converted into glucose and oxygen.",
      pageNumber: 2,
      completed: false,
    },
    {
      id: "4",
      question: "Who wrote 'To Kill a Mockingbird'?",
      answer: "Harper Lee",
      pageNumber: 3,
      completed: false,
    },
    {
      id: "5",
      question: "What is the chemical symbol for gold?",
      answer: "Au",
      pageNumber: 5,
      completed: false,
    },
  ];

  return NextResponse.json(dummyQuestions);
}
