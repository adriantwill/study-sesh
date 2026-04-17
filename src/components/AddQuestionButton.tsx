"use client";

import { Plus } from "lucide-react";
import { addQuestionAction } from "../app/actions";

interface AddQuestionButtonProps {
  uploadId: string;
  insertAtPosition?: number;
  prevDisplayOrder?: number | null;
  nextDisplayOrder?: number | null;
}

export default function AddQuestionButton({
  uploadId,
  insertAtPosition,
  prevDisplayOrder,
  nextDisplayOrder,
}: AddQuestionButtonProps) {
  async function addUntitledQuestion() {
    try {
      await addQuestionAction(
        uploadId,
        insertAtPosition ?? 0,
        prevDisplayOrder,
        nextDisplayOrder,
      );
    } catch (error) {
      console.error("Failed to add question:", error);
    }
  }

  return (
    <button
      type="button"
      onClick={addUntitledQuestion}
      className="flex w-full cursor-pointer justify-center py-2 text-muted-foreground hover:text-primary"
    >
      <Plus size={20} />
    </button>
  );
}
