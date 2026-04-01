"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addQuestionAction } from "../app/actions";
import type { StudyQuestion } from "../types";

interface AddQuestionButtonProps {
  uploadId: string;
  insertAtPosition?: number;
  onQuestionAdded?: (question: StudyQuestion) => void;
}

export default function AddQuestionButton({
  uploadId,
  insertAtPosition,
  onQuestionAdded,
}: AddQuestionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function addUntitledQuestion() {
    startTransition(async () => {
      const question = await addQuestionAction(
        uploadId,
        "Untitled question",
        "untitled answer",
        insertAtPosition ?? 0,
      );

      onQuestionAdded?.(question);
      router.refresh();
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
