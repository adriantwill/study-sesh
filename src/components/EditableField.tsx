"use client";

import { useState, useMemo } from "react";
import { StudyQuestion } from "../types";
import { createClient } from "../lib/supabase/client";
import { TbCheckbox, TbEdit } from "react-icons/tb";
import DeleteButton from "./DeleteButton";

interface EditableFieldProps {
  question: StudyQuestion;
  variant?: "question" | "answer";
}

export default function EditableField({
  question,
  variant = "question",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(
    variant === "question" ? question.question : question.answer,
  );
  const [complete, setComplete] = useState<"" | "line-through opacity-70">(
    question.completed === true ? "line-through opacity-70" : "",
  );
  const supabase = useMemo(() => createClient(), []);

  const handleBlur = async () => {
    setIsEditing(false);
    const field = `${variant}_text`;
    await supabase
      .from("questions")
      .update({ [field]: text })
      .eq("id", question.id);
  };
  const completeQuestion = async () => {
    await supabase
      .from("questions")
      .update({
        completed: complete === "line-through opacity-70" ? false : true,
      })
      .eq("id", question.id);
    setComplete((prev) => (prev === "" ? "line-through opacity-70" : ""));
  };
  const inputStyles =
    variant === "question" ? "mb-3  px-3 py-2 " : " px-2 py-1 ";

  const displayStyles =
    variant === "question"
      ? " font-medium text-foreground mb-3"
      : "  text-foreground/90";

  if (isEditing) {
    return (
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={` w-full font-medium text-foreground bg-muted-hover rounded ${inputStyles} ${complete}`}
        onBlur={handleBlur}
        autoFocus
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-between ${displayStyles} ${complete}`}
    >
      {text}
      <div className="*:size-6 *:cursor-pointer flex items-center gap-1 *enabled:hover:text-secondary *:disabled:cursor-auto">
        <button
          onClick={() => setIsEditing(true)}
          aria-label={`Edit ${variant}`}
          disabled={complete === "line-through opacity-70"}
        >
          <TbEdit />
        </button>
        {variant === "question" && (
          <>
            <button
              onClick={() => completeQuestion()}
              aria-label="Mark as complete"
            >
              <TbCheckbox />
            </button>
            <DeleteButton id={question.id} variant="question" />
          </>
        )}
      </div>
    </div>
  );
}
