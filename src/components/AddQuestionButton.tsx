"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { addQuestionAction } from "../app/actions";

interface AddQuestionButtonProps {
  uploadId: string;
  insertAtPosition?: number;
}

export default function AddQuestionButton({
  uploadId,
  insertAtPosition,
}: AddQuestionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [answer, setAnswer] = useState("");

  function addUntitledQuestion() {
    addQuestionAction(
      uploadId,
      "Untitled question",
      "untitled answer",
      insertAtPosition ?? 0,
    );
  }

  function handleSubmit(formData: FormData) {
    const question = formData.get("question") as string;

    // Close modal immediately (optimistic)
    setIsOpen(false);
    setAnswer("");

    addQuestionAction(uploadId, question, answer, insertAtPosition ?? 0);
  }

  function handleAnswerChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (value.endsWith("- ")) {
      const beforeDash = value.slice(0, -2);
      const isLineStart = beforeDash.length === 0 || beforeDash.endsWith("\n");

      if (isLineStart) {
        const newValue = `${beforeDash}• `;
        setAnswer(newValue);
        setTimeout(() => {
          e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
        }, 0);
        return;
      }
    }
    setAnswer(value);
  }

  return (
    <button
      type="button"
      onClick={addUntitledQuestion}
      className="w-full py-2 text-muted-foreground hover:text-primary flex justify-center cursor-pointer"
    >
      <Plus size={20} />
    </button>
  );
}
