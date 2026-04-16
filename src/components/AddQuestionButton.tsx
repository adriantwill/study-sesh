"use client";

import { Plus } from "lucide-react";
import { useTransition } from "react";
import { addQuestionAction } from "../app/actions";
import type { StudyQuestion } from "../types";

interface AddQuestionButtonProps {
  uploadId: string;
  insertAtPosition?: number;
  onQuestionAdded?: (question: StudyQuestion) => void;
  onQuestionSaved?: (tempId: string, question: StudyQuestion) => void;
  onQuestionAddFailed?: (tempId: string) => void;
}

export default function AddQuestionButton({
  uploadId,
  insertAtPosition,
  onQuestionAdded,
  onQuestionSaved,
  onQuestionAddFailed,
}: AddQuestionButtonProps) {
  const [isPending, startTransition] = useTransition();

  function addUntitledQuestion() {
    startTransition(async () => {
      const tempId = `temp-question-${crypto.randomUUID()}`;
      onQuestionAdded?.({
        id: tempId,
        upload_id: uploadId,
        question: "Untitled question",
        answer: "untitled answer",
        displayOrder:
          (insertAtPosition ?? 0) <= 0
            ? 50
            : (insertAtPosition ?? 0) + 0.5,
      });

      try {
        const question = await addQuestionAction(
          uploadId,
          "Untitled question",
          "untitled answer",
          insertAtPosition ?? 0,
        );

        onQuestionSaved?.(tempId, question);
      } catch (error) {
        console.error("Failed to add question:", error);
        onQuestionAddFailed?.(tempId);
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
