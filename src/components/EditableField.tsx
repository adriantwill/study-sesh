"use client";

import { useState, useTransition } from "react";
import { StudyQuestion } from "../types";
import { TbCheckbox, TbEdit } from "react-icons/tb";
import DeleteButton from "./DeleteButton";
import { FaRegImage } from "react-icons/fa6";
import {
  updateQuestionTextAction,
  toggleCompleteAction,
  uploadImageAction,
} from "../app/actions";

interface EditableFieldProps {
  question: StudyQuestion;
  variant: "question" | "answer";
}

export default function EditableField({
  question,
  variant = "question",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(
    variant === "question" ? question.question : question.answer,
  );

  const [isPending, startTransition] = useTransition();

  const handleBlur = async () => {
    setIsEditing(false);
    if (text === (variant === "question" ? question.question : question.answer))
      return;

    startTransition(async () => {
      try {
        await updateQuestionTextAction(question.id, text, variant);
      } catch (e) {
        alert("Failed to save changes");
      }
    });
  };

  const inputStyles = variant === "question" ? "mb-3 px-3 py-2" : "px-2 py-1";

  const displayStyles =
    variant === "question"
      ? "font-medium text-foreground mb-3"
      : "text-foreground/90";

  const completion = question.completed ? "line-through opacity-70" : "";
  const toggleCompleteParams = toggleCompleteAction.bind(
    null,
    question.id,
    question.completed,
  );

  return (
    <>
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`w-full font-medium text-foreground bg-muted-hover rounded ${inputStyles}`}
          onBlur={handleBlur}
          autoFocus
          disabled={isPending}
        />
      ) : (
        <>
          <div
            className={`flex items-center justify-between ${displayStyles} ${completion}`}
          >
            <span className={isPending ? "animate-pulse" : ""}>{text}</span>

            <div className="flex items-center gap-1 opacity-100 *:size-6 *:cursor-pointer  *:hover:text-secondary *:disabled:cursor-auto *:disabled:hover:text-black">
              <button
                onClick={() => setIsEditing(true)}
                aria-label={`Edit ${variant}`}
                disabled={question.completed}
              >
                <TbEdit />
              </button>
              {variant === "question" && (
                <>
                  <form action={toggleCompleteParams}>
                    <button aria-label="Mark as complete" disabled={isPending}>
                      <TbCheckbox
                        className={question.completed ? "text-success" : ""}
                      />
                    </button>
                  </form>
                  <form action={uploadImageAction}>
                    <input type="hidden" name="questionId" value={question.id} />
                    <label
                      htmlFor={`file-upload-${question.id}`}
                      aria-label="Upload image"
                    >
                      <FaRegImage />
                    </label>
                    <input
                      id={`file-upload-${question.id}`}
                      name="file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isPending || question.completed}
                      onChange={(e) => e.target.form?.requestSubmit()}
                    />
                  </form>
                  <DeleteButton id={question.id} variant="question" />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
