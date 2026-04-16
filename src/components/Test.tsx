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
  const [questions, setQuestions] = useState(initialQuestions);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const dragStartQuestionsRef = useRef<StudyQuestion[] | null>(null);
  const isAnyEditing = editingFields.size > 0;

  useEffect(() => {
    setQuestions(initialQuestions);
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

  function handleQuestionAdded(question: StudyQuestion) {
    setQuestions((currentQuestions) => {
      const nextQuestions = [...currentQuestions, question];
      nextQuestions.sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      );
      return nextQuestions;
    });
  }

  function handleQuestionSaved(tempId: string, question: StudyQuestion) {
    setQuestions((currentQuestions) =>
      currentQuestions
        .map((currentQuestion) =>
          currentQuestion.id === tempId ? question : currentQuestion,
        )
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
    );
  }

  function handleQuestionAddFailed(tempId: string) {
    setQuestions((currentQuestions) =>
      currentQuestions.filter((question) => question.id !== tempId),
    );
  }

  function updateQuestion(
    questionId: string,
    updater: (question: StudyQuestion) => StudyQuestion,
  ) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    );
  }

  function handleDragStart(questionId: string) {
    if (isAnyEditing) return;
    dragStartQuestionsRef.current = questions;
    setActiveId(questionId);
  }

  function handleDragEnd() {
    setActiveId(null);
    setDragOverId(null);
    dragStartQuestionsRef.current = null;
  }

  function handleDragOver(e: React.DragEvent, questionId: string) {
    e.preventDefault();
    if (!activeId || activeId === questionId) return;
    setDragOverId(questionId);
    setQuestions((currentQuestions) => {
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

    const previousQuestions = dragStartQuestionsRef.current ?? questions;
    handleDragEnd();
    try {
      await reorderQuestionsAction(activeId, questions);
    } catch (error) {
      console.error("Failed to reorder questions", error);
      setQuestions(previousQuestions);
    }
  }

  async function handleQuestionDelete(questionId: string) {
    const previousQuestions = questions;
    setQuestions((currentQuestions) =>
      currentQuestions.filter((question) => question.id !== questionId),
    );

    try {
      await deleteItemAction(questionId, "question");
    } catch (error) {
      console.error("Failed to delete question", error);
      setQuestions(previousQuestions);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {questions.map((q, idx) => (
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
                      onSave={(text) =>
                        updateQuestion(q.id, (question) => ({
                          ...question,
                          question: text,
                        }))
                      }
                      onEditingChange={(isEditing) =>
                        handleEditingChange(`${q.id}:question_text`, isEditing)
                      }
                    />
                    <ImageUploadButton
                      id={q.id}
                      onImageSelected={(imageUrl) =>
                        updateQuestion(q.id, (question) => ({
                          ...question,
                          imageUrl,
                        }))
                      }
                    />
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
                        onSave={(text) =>
                          updateQuestion(q.id, (question) => ({
                            ...question,
                            answer: text,
                          }))
                        }
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
              onQuestionAdded={handleQuestionAdded}
              onQuestionSaved={handleQuestionSaved}
              onQuestionAddFailed={handleQuestionAddFailed}
            />
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
}
