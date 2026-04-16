"use client";

import { Plus } from "lucide-react";
import { useTransition } from "react";
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
  prevDisplayOrder: _prevDisplayOrder,
  nextDisplayOrder: _nextDisplayOrder,
}: AddQuestionButtonProps) {
  const [isPending, startTransition] = useTransition();

  function addUntitledQuestion() {
    startTransition(async () => {
      try {
        await addQuestionAction(
          uploadId,
          insertAtPosition ?? 0,
        );
      } catch (error) {
        console.error("Failed to add question:", error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={addUntitledQuestion}
      disabled={isPending}
      className="flex w-full cursor-pointer justify-center py-2 text-muted-foreground hover:text-primary disabled:cursor-wait disabled:opacity-50"
    >
      <Plus size={20} />
    </button>
  );
}
