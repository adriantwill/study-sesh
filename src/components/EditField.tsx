"use client";
import { useState } from "react";
import { Check, Pencil, Image as ImageIcon } from "lucide-react";
import { updateQuestionTextAction, uploadImageAction } from "../app/actions";

interface EditFieldProps {
  variant: "question_text" | "answer_text" | "filename";
  textField: string;
  id: string;
  completed: boolean;
}

export default function EditField({
  variant,
  textField,
  id,
  completed,
}: EditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(textField);
  const updateQuestion = updateQuestionTextAction.bind(null, id, text, variant);
  const uploadImageWithId = uploadImageAction.bind(null, id);

  //TODO make sure that db doesnt change if text isnt different
  return (
    <>
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`w-5/6 font-medium text-foreground bg-muted-hover rounded px-2 py-1`}
          onBlur={updateQuestion}
          autoFocus
        />
      ) : (
        <span
          className={`w-5/6 ${variant === "answer_text" ? "whitespace-pre-wrap" : ""}`}
        >
          {text}
        </span>
      )}
      {variant === "question_text" && (
        <form action={uploadImageWithId} className="flex items-center">
          <label
            htmlFor={`file-upload-${id}`}
            aria-label="Upload image"
            className={`flex items-center justify-center ${!completed ? "cursor-pointer hover:text-secondary" : ""}`}
          >
            <ImageIcon size={16} />
          </label>
          <input
            disabled={completed}
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
        onClick={() => setIsEditing(!isEditing)}
        aria-label={`Edit ${variant}`}
        className="flex items-center justify-center cursor-pointer disabled:cursor-auto hover:text-secondary disabled:text-white"
        disabled={completed}
      >
        {!isEditing ? <Pencil size={16} /> : <Check size={16} />}
      </button>
    </>
  );
}
