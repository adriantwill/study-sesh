"use client";

import { useState } from "react";
import { LiaEditSolid } from "react-icons/lia";
import { StudyQuestion } from "../app/api/generate-questions/route";
import { createClient } from "../lib/supabase/client";
import { TbEdit } from "react-icons/tb";

interface EditableFieldProps {
  question: StudyQuestion;
  variant?: "question" | "answer";
  children?: React.ReactNode;
}

export default function EditableField({
  question,
  variant = "question",
  children,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(
    variant == "question" ? question.question : question.answer,
  );
  const supabase = createClient();

  const handleBlur = async () => {
    setIsEditing(false);
    const field = `${variant}_text`;
    await supabase
      .from("questions")
      .update({ [field]: text })
      .eq("id", question.id);
  };

  const inputStyles =
    variant === "question"
      ? "w-full font-medium text-foreground mb-3 bg-muted-hover px-3 py-2 rounded"
      : "w-full font-medium text-foreground bg-muted-hover px-2 py-1 rounded";

  const displayStyles =
    variant === "question"
      ? "flex justify-between items-center font-medium text-foreground mb-3"
      : "flex justify-between items-center text-foreground/90";

  if (isEditing) {
    return (
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={inputStyles}
        onBlur={handleBlur}
        autoFocus
      />
    );
  }

  return (
    <div className={displayStyles}>
      {text}
      <div className="*:size-6 *:cursor-pointer flex items-center gap-1">
        <TbEdit
          className="  hover:text-secondary"
          onClick={() => setIsEditing(true)}
        />
        {children}
      </div>
    </div>
  );
}
