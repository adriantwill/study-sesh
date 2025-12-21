"use client";

import { useState } from "react";
import { LiaEditSolid } from "react-icons/lia";
import { StudyQuestion } from "../app/api/generate-questions/route";
import { createClient } from "../lib/supabase/client";
import { PiTrash } from "react-icons/pi";
import { useRouter } from "next/navigation";

export default function QuestionCard({
  question,
}: {
  question: StudyQuestion;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [questionText, setQuestionText] = useState(question.question);
  const [answerText, setAnswerText] = useState(question.answer);
  const supabase = createClient();
  const router = useRouter();
  const deleteQuestion = async () => {
    await supabase.from("questions").delete().eq("id", question.id);
    router.refresh();
  };
  const updateField = async (field: string, value: string) => {
    if (field === "question") {
      setQuestionText(value);
      await supabase
        .from("questions")
        .update({ question_text: value })
        .eq("id", question.id);
    } else if (field === "answer") {
      setAnswerText(value);
      await supabase
        .from("questions")
        .update({ answer_text: value })
        .eq("id", question.id);
    }
  };
  return (
    <div className="flex-1">
      <div className="flex justify-between ">
        <div className="text-xs text-muted-foreground mb-2">
          Page {question.pageNumber}
        </div>
      </div>
      {isEditing ? (
        <input
          type="text"
          value={questionText}
          onChange={(e) => updateField("question", e.target.value)}
          className="w-full font-medium text-foreground mb-3 bg-muted-hover px-3 py-2 rounded"
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      ) : (
        <div className="flex justify-between items-center font-medium text-foreground mb-3 ">
          {questionText}
          <div className="flex *:hover:text-secondary *:cursor-pointer *:size-6">
            <LiaEditSolid
              className=" "
              onClick={() => setIsEditing(!isEditing)}
            />
            <PiTrash onClick={deleteQuestion} />
          </div>
        </div>
      )}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground ">
          Show answer
        </summary>
        <div className=" mt-2 p-4 rounded-lg bg-muted-hover ">
          {isEditingAnswer ? (
            <input
              type="text"
              value={answerText}
              onChange={(e) => updateField("answer", e.target.value)}
              className="w-full font-medium text-foreground bg-muted-hover px-2 py-1 rounded"
              onBlur={() => setIsEditingAnswer(false)}
              autoFocus
            />
          ) : (
            <div className="flex justify-between items-center text-foreground/90">
              {answerText}
              <LiaEditSolid
                className="size-5 cursor-pointer hover:text-secondary"
                onClick={() => setIsEditingAnswer(!isEditingAnswer)}
              />
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
