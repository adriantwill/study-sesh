"use client";
import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import {
  updateFolderNameAction,
  updateQuestionTextAction,
} from "../app/actions";
import { parseMarkdown } from "../lib/markdown";

interface EditFieldProps {
  variant: "question_text" | "answer_text" | "folder_name" | "filename" | "description";
  textField: string;
  id: string;
}

export default function EditField({ variant, textField, id }: EditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(textField);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (variant !== "folder_name" && value.endsWith("- ")) {
      const newValue = `${value.slice(0, -2)}• `;
      setText(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = cursorPos;
      }, 0);
      return;
    }
    setText(value);
  }

  async function handleSave() {
    if (text !== textField) {
      if (variant === "folder_name") {
        await updateFolderNameAction(id, text);
      } else {
        await updateQuestionTextAction(id, text, variant);
      }
    }
    setIsEditing(!isEditing);
  }

  return (
    <>
      {isEditing ? (
        <textarea
          value={text}
          onChange={handleTextChange}
          onPointerDown={(e) => e.stopPropagation()}
          rows={Math.max(1, text.split("\n").length)}
          className={`w-full h-full font-medium text-foreground bg-muted-hover rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:border-ring`}
        />
      ) : (
        <span className={`w-full whitespace-pre-wrap }`}>
          {variant === "folder_name" ? text : parseMarkdown(text)}
        </span>
      )}
      <button
        type="button"
        onClick={handleSave}
        aria-label={`Edit text`}
        className="flex items-center justify-center enabled:cursor-pointer enabled:hover:text-secondary "
      >
        {!isEditing ? <Pencil size={16} /> : <Check size={16} />}
      </button>
    </>
  );
}
