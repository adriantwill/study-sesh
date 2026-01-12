"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addQuestionAction } from "../app/actions";

export default function AddQuestionButton({ uploadId }: { uploadId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const question = formData.get("question") as string;
    const answer = formData.get("answer") as string;
    const pageNumber = parseInt(formData.get("pageNumber") as string);

    await addQuestionAction(uploadId, question, answer, pageNumber);
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex text-lg items-center cursor-pointer px-4 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
      >
        Add Question
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-xl overscroll-none">
          <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Question</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Slide Number
                </label>
                <input
                  type="number"
                  name="pageNumber"
                  defaultValue={1}
                  min={1}
                  required
                  className="w-full px-3 py-2 bg-muted rounded border border-muted-foreground/20 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Question
                </label>
                <textarea
                  name="question"
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded border border-muted-foreground/20 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea
                  name="answer"
                  required
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded border border-muted-foreground/20 focus:outline-none focus:border-primary"
                />
              </div>

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
