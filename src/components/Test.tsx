"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { reorderQuestionsAction } from "../app/actions";
import type { StudyQuestion } from "../types";
import AddQuestionButton from "./AddQuestionButton";
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

function ResizableImage({ src }: { src: string }) {
  const [width, setWidth] = useState(500);
  const [rotation, setRotation] = useState(0);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    function handlePointerMove(event: PointerEvent) {
      setWidth(Math.max(180, startWidth + event.clientX - startX));
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <div className="relative mt-3 inline-block max-w-full">
      <button
        type="button"
        aria-label="Rotate image"
        onClick={() => setRotation((prev) => (prev + 90) % 360)}
        className="absolute top-2 right-2 z-10 rounded-md bg-black/50 px-2 py-1 text-xs text-white"
      >
        Rotate
      </button>
      <div style={{ width }} className="max-w-full">
        <Image
          src={src}
          alt="supporting image"
          width={500}
          height={500}
          className="block h-auto w-full rounded-md border border-muted-foreground/20 object-contain"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      <button
        type="button"
        aria-label="Resize image"
        onPointerDown={handlePointerDown}
        className="absolute right-1 bottom-1 h-4 w-4 cursor-se-resize rounded-sm bg-black/50"
      />
    </div>
  );
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
      if (isEditing) {
        if (prev.has(fieldKey)) return prev;
        const next = new Set(prev);
        next.add(fieldKey);
        return next;
      }

      if (!prev.has(fieldKey)) return prev;
      {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      }
    });
  }

  function handleQuestionAdded(question: StudyQuestion) {
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions, question];
      nextQuestions.sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      );
      return nextQuestions;
    });
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {questions.map((q, idx) => (
          <React.Fragment key={q.id}>
            <li
              draggable={!isAnyEditing}
              onDragStart={() => {
                if (isAnyEditing) return;
                setActiveId(q.id);
                setDidReorder(false);
              }}
              onDragEnd={() => setActiveId(null)}
              onDragOver={(e) => handleDragOver(e, q.id)}
              onDrop={handleDrop}
              className={`transition-[opacity,transform,box-shadow] duration-150 ${activeId === q.id
                ? "cursor-grabbing opacity-0"
                : ""
                } ${isAnyEditing ? "cursor-default" : "cursor-grab"
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
                      <ResizableImage src={q.imageUrl} />
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
                      {/*<div className="text-sm mt-4">Wrong Options</div>
                      <div className="grid grid-cols-3 gap-4">
                        {[0, 1, 2].map((optionIdx) => (
                          <div
                            key={`${q.id}-option-${optionIdx}`}
                            className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover"
                          >
                            <EditField
                              variant={optionIdx as 0 | 1 | 2}
                              textField={q.options?.[optionIdx] ?? ""}
                              id={q.id}
                              onEditingChange={(isEditing) =>
                                handleEditingChange(
                                  `${q.id}:option_${optionIdx}`,
                                  isEditing,
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>*/}
                    </details>
                  </div>
                </div>
              </div>
            </li>
            <AddQuestionButton
              uploadId={reviewId}
              insertAtPosition={q.displayOrder ?? 0}
              onQuestionAdded={handleQuestionAdded}
            />
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
}
