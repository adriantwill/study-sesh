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

  function handleSubmit(formData: FormData) {
    const question = formData.get("question") as string;

    // Close modal immediately (optimistic)
    setIsOpen(false);
    setAnswer("");

    // Fire server action without awaiting
    addQuestionAction(uploadId, question, answer, insertAtPosition ?? 1);
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
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2 text-muted-foreground hover:text-primary flex justify-center cursor-pointer"
      >
        <Plus size={20} />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-lg overscroll-none">
          <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Question</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="hover:text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-sm font-medium mb-1">Question</span>
                <textarea
                  name="question"
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded border border-muted-foreground/20 focus:outline-none focus:border-primary"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-1">Answer</span>
                <textarea
                  name="answer"
                  value={answer}
                  onChange={handleAnswerChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded border border-muted-foreground/20 focus:outline-none focus:border-primary"
                />
              </label>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted-hover rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
