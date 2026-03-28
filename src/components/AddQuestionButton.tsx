"use client";

import { Plus } from "lucide-react";
import { addQuestionAction } from "../app/actions";

interface AddQuestionButtonProps {
  uploadId: string;
  insertAtPosition?: number;
}

export default function AddQuestionButton({
  uploadId,
  insertAtPosition,
}: AddQuestionButtonProps) {

  function addUntitledQuestion() {
    addQuestionAction(
      uploadId,
      "Untitled question",
      "untitled answer",
      insertAtPosition ?? 0,
    );
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
