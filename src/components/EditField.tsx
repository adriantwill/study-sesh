"use client";
import { useState } from "react";
import { Check, Pencil, Image as ImageIcon } from "lucide-react";
import { updateQuestionTextAction, uploadImageAction } from "../app/actions";
import { parseMarkdown } from "../lib/markdown";
import Link from "next/link";

interface EditFieldProps {
  variant: "question_text" | "answer_text" | "filename";
  textField: string;
  id: string;
}

export default function EditField({
  variant,
  textField,
  id,
}: EditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(textField);
  const updateQuestion = updateQuestionTextAction.bind(null, id, text, variant);
  const uploadImageWithId = uploadImageAction.bind(null, id);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (value.endsWith("- ")) {
      const beforeDash = value.slice(0, -2);
      const isLineStart = beforeDash.length === 0 || beforeDash.endsWith("\n");

      if (isLineStart) {
        const newValue = beforeDash + "• ";
        setText(newValue);
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
        }, 0);
        return;
      }
    }
    setText(value);
  }

  return (
    <>
      {isEditing ? (
        <textarea
          value={text}
          onChange={handleTextChange}
          className={`w-full font-medium h-7 text-foreground bg-muted-hover rounded px-2 py-1`}
          autoFocus
        />
      ) : variant === "filename" ? (
        <Link href={`/${id}`}
          className="w-full hover:text-muted-foreground">
          {text}
        </Link>
      ) : (
        <span
          className={`w-full ${variant === "answer_text" ? "whitespace-pre-wrap" : ""}`}
        >
          {parseMarkdown(text)}
        </span>
      )}
      {variant === "question_text" && (
        <form action={uploadImageWithId} className="flex items-center">
          <label
            htmlFor={`file-upload-${id}`}
            aria-label="Upload image"
            className={`flex items-center justify-center cursor-pointer hover:text-secondary`}
          >
            <ImageIcon size={16} />
          </label>
          <input
            id={`file-upload-${id}`}
            name="file"
            type="file"
            accept="image/*"
            className="hidden "
            onChange={(e) => e.target.form?.requestSubmit()}
          />
        </form>
      )}

      <button
        onClick={() => {
          if (text !== textField) {
            updateQuestion();
          }
          setIsEditing(!isEditing);
        }}
        aria-label={`Edit ${variant}`}
        className="flex items-center justify-center enabled:cursor-pointer  enabled:hover:text-secondary "
      >
        {!isEditing ? <Pencil size={16} /> : <Check size={16} />}
      </button>
    </>
  );
}
