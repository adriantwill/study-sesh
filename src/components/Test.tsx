"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import {
  deleteItemAction,
  reorderQuestionsAction,
} from "../app/actions";
import type { StudyQuestion } from "../types";
import AddQuestionButton from "./AddQuestionButton";
import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import ImageUploadButton from "./ImageUploadButton";

interface TestProps {
  questions: StudyQuestion[];
  reviewId: string;
}


function ResizableImage({ src }: { src: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [maxHeight, setMaxHeight] = useState<number>();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !aspectRatio) return;

    const updateSize = () => {
      setMaxHeight(wrapper.clientWidth / aspectRatio);
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, [aspectRatio]);

  return (
    <div
      ref={wrapperRef}
      className="mt-3 w-[500px] max-w-full overflow-auto resize rounded-md border border-muted-foreground/20 object-contain"
      style={maxHeight ? { maxHeight } : undefined}
    >
      <Image
        src={src}
        alt="supporting image"
        width={500}
        height={500}
        className="block h-auto w-full rounded-md object-contain"
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget;
          if (!naturalWidth || !naturalHeight) return;
          setAspectRatio(naturalWidth / naturalHeight);
        }}
      />
    </div>
  );
}

export default function Test({ questions: initialQuestions, reviewId }: TestProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [previewQuestions, setPreviewQuestions] = useState(initialQuestions);
  const isAnyEditing = editingFields.size > 0;

  useEffect(() => {
    setPreviewQuestions(initialQuestions);
  }, [initialQuestions]);

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

  function handleDragStart(questionId: string) {
    if (isAnyEditing) return;
    setActiveId(questionId);
  }

  function handleDragEnd() {
    setActiveId(null);
    setDragOverId(null);
    setPreviewQuestions(initialQuestions);
  }

  function handleDragOver(e: React.DragEvent, questionId: string) {
    e.preventDefault();
    if (!activeId || activeId === questionId) return;
    setDragOverId(questionId);
    setPreviewQuestions((currentQuestions) => {
      const fromIndex = currentQuestions.findIndex((q) => q.id === activeId);
      const toIndex = currentQuestions.findIndex((q) => q.id === questionId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return currentQuestions;
      }


      const nextQuestions = [...currentQuestions];
      const [movedQuestion] = nextQuestions.splice(fromIndex, 1);

      if (!movedQuestion) return currentQuestions;

      nextQuestions.splice(toIndex, 0, movedQuestion);
      return nextQuestions;
    });
  }

  async function handleDrop(questionId: string) {
    if (!activeId) {
      handleDragEnd();
      return;
    }

    const reorderedQuestions = previewQuestions;
    handleDragEnd();
    try {
      await reorderQuestionsAction(activeId, reorderedQuestions);
    } catch (error) {
      console.error("Failed to reorder questions", error);
    }
  }

  async function handleQuestionDelete(questionId: string) {
    try {
      await deleteItemAction(questionId, "question");
    } catch (error) {
      console.error("Failed to delete question", error);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {previewQuestions.map((q, idx) => {
          const prevDisplayOrder = q.displayOrder ?? null;
          const nextDisplayOrder = previewQuestions[idx + 1]?.displayOrder ?? null;

          return (
            <React.Fragment key={q.id}>
              <li
                draggable={!isAnyEditing}
                onDragStart={() => handleDragStart(q.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, q.id)}
                onDrop={() => void handleDrop(q.id)}
                className={`transition-[opacity,transform,box-shadow] duration-150 ${activeId === q.id
                  ? "cursor-grabbing opacity-0"
                  : ""
                  } ${dragOverId === q.id ? "scale-[1.01] shadow-lg" : ""
                  } ${isAnyEditing ? "cursor-default" : "cursor-grab"
                  }`}
              >
                <div className="bg-muted rounded-lg shadow p-6 flex items-start gap-4">
                  <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 w-1">
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
                      <DeleteButton
                        id={q.id}
                        variant="question"
                        name={q.question}
                        onDelete={() => handleQuestionDelete(q.id)}
                      />
                    </div>
                    {q.imageUrl && (
                      <ResizableImage src={q.imageUrl} />
                    )}
                    <details className="text-sm mt-4">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Show answer
                      </summary>
                      <div className="gap-2 flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
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
              </li>
              <AddQuestionButton
                uploadId={reviewId}
                insertAtPosition={q.displayOrder ?? 0}
                prevDisplayOrder={prevDisplayOrder}
                nextDisplayOrder={nextDisplayOrder}
              />
            </React.Fragment>
          );
        })}
      </ul>
    </div>
  );
}
