"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { reorderQuestionsAction } from "../app/actions";
import type { StudyQuestion } from "../types";
import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import ImageUploadButton from "./ImageUploadButton";

interface TestProps {
  questions: StudyQuestion[];
  reviewId: string;
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function Test({ questions: initialQuestions, reviewId }: TestProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [didReorder, setDidReorder] = useState(false);
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const isAnyEditing = editingFields.size > 0;

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  function handleDragOver(e: React.DragEvent<HTMLLIElement>, overId: string) {
    e.preventDefault();
    if (!activeId || activeId === overId) return;

    const from = questions.findIndex((q) => q.id === activeId);
    const to = questions.findIndex((q) => q.id === overId);
    if (from === -1 || to === -1 || from === to) return;

    setQuestions(arrayMove(questions, from, to));
    setDidReorder(true);
  }

  async function handleDrop() {
    if (!didReorder) return;

    try {
      await reorderQuestionsAction(questions.map((q) => q.id));
    } catch (error) {
      console.error("Failed to persist question order", error);
    } finally {
      setDidReorder(false);
    }
  }

  function handleEditingChange(fieldKey: string, isEditing: boolean) {
    setEditingFields((prev) => {
      const next = new Set(prev);
      if (isEditing) {
        next.add(fieldKey);
      } else {
        next.delete(fieldKey);
      }
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {questions.map((q, idx) => (
          <li
            key={q.id}
            draggable={!isAnyEditing}
            onDragStart={() => {
              if (isAnyEditing) return;
              setActiveId(q.id);
              setDidReorder(false);
            }}
            onDragEnd={() => setActiveId(null)}
            onDragOver={(e) => handleDragOver(e, q.id)}
            onDrop={handleDrop}
            className={`${activeId === q.id ? "cursor-grabbing" : ""} ${isAnyEditing ? "cursor-default" : "cursor-grab"
              }`}
          >
            <div className="bg-muted rounded-lg shadow p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <EditField
                      variant={"question_text"}
                      textField={q.question}
                      id={q.id}
                      onEditingChange={(isEditing) =>
                        handleEditingChange(`${q.id}:question_text`, isEditing)
                      }
                    />
                    <ImageUploadButton id={q.id} />
                    <DeleteButton id={q.id} variant="question" name={q.question} />
                  </div>
                  {q.imageUrl && (
                    <Image
                      src={q.imageUrl}
                      alt="supporting image"
                      width={500}
                      height={500}
                      className="mt-3 rounded-md border border-muted-foreground/20"
                    />
                  )}
                  <details className="text-sm mt-4">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Show answer
                    </summary>
                    <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                      <EditField
                        variant={"answer_text"}
                        textField={q.answer}
                        id={q.id}
                        onEditingChange={(isEditing) =>
                          handleEditingChange(`${q.id}:answer_text`, isEditing)
                        }
                      />
                    </div>
                    <div className="text-sm mt-4">Wrong Options</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                        <EditField
                          variant={0}
                          textField={q.options?.[0] ?? ""}
                          id={q.id}
                          onEditingChange={(isEditing) =>
                            handleEditingChange(`${q.id}:option_0`, isEditing)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                        <EditField
                          variant={1}
                          textField={q.options?.[1] ?? ""}
                          id={q.id}
                          onEditingChange={(isEditing) =>
                            handleEditingChange(`${q.id}:option_1`, isEditing)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                        <EditField
                          variant={2}
                          textField={q.options?.[2] ?? ""}
                          id={q.id}
                          onEditingChange={(isEditing) =>
                            handleEditingChange(`${q.id}:option_2`, isEditing)
                          }
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
