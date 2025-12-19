"use client";

import { useState } from "react";
import { LiaEditSolid } from "react-icons/lia";
import { StudyQuestion } from "../app/api/generate-questions/route";
import { createClient } from "../lib/supabase/client";

export default function QuestionCard({
  question,
  index,
}: {
  question: StudyQuestion;
  index: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);
  const [questionText, setQuestionText] = useState(question.question);
  const [answerText, setAnswerText] = useState(question.answer);
  const supabase = createClient();

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
    <div className="bg-muted rounded-lg shadow p-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex justify-between ">
            <div className="text-xs text-muted-foreground mb-2">
              Page {question.pageNumber}
            </div>
            <LiaEditSolid
              className="size-7 cursor-pointer hover:text-secondary"
              onClick={() => setIsEditing(!isEditing)}
            />
          </div>
          {isEditing ? (
            <input
              type="text"
              value={questionText}
              onChange={(e) => updateField("question", e.target.value)}
              className="w-11/12 font-medium text-foreground mb-3 bg-muted-hover px-3 py-2 rounded"
              onBlur={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <div className="font-medium text-foreground mb-3 ">
              {questionText}
            </div>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Show answer
            </summary>
            <div className="flex justify-between mt-2 p-4 rounded-lg bg-muted-hover ">
              {isEditingAnswer ? (
                <input
                  type="text"
                  value={answerText}
                  onChange={(e) => updateField("answer", e.target.value)}
                  className="w-11/12 font-medium text-foreground bg-muted-hover px-2 py-1 rounded"
                  onBlur={() => setIsEditingAnswer(false)}
                  autoFocus
                />
              ) : (
                <div className="text-foreground/90">{answerText}</div>
              )}
              <LiaEditSolid
                className="size-5 cursor-pointer hover:text-secondary"
                onClick={() => setIsEditingAnswer(!isEditingAnswer)}
              />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
