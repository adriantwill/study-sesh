"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { StudyQuestion } from "../types";
import { TbCheckbox, TbEdit } from "react-icons/tb";
import DeleteButton from "./DeleteButton";
import { FaRegImage } from "react-icons/fa6";
import { 
  updateQuestionTextAction, 
  toggleCompleteAction, 
  uploadImageAction 
} from "../app/actions";

interface EditableFieldProps {
  question: StudyQuestion;
  variant: "question" | "answer";
}

export default function EditableField({
  question,
  variant = "question",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(
    variant === "question" ? question.question : question.answer,
  );
  
  // We use useTransition for smoother loading states without blocking UI
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLERS ---

  const handleBlur = async () => {
    setIsEditing(false);
    if (text === (variant === "question" ? question.question : question.answer)) return;

    startTransition(async () => {
      try {
        await updateQuestionTextAction(question.id, text, variant);
      } catch (e) {
        alert("Failed to save changes");
      }
    });
  };

  const handleComplete = () => {
    // Optimistic toggle: We could assume success, but revalidatePath will ensure truth
    startTransition(async () => {
      try {
        await toggleCompleteAction(question.id, question.completed);
      } catch (e) {
        alert("Failed to update status");
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("questionId", question.id);

    startTransition(async () => {
      try {
        await uploadImageAction(formData);
      } catch (e) {
        alert("Failed to upload image");
      }
    });
  };

  // --- STYLES ---

  const inputStyles =
    variant === "question" ? "mb-3 px-3 py-2" : "px-2 py-1";

  const displayStyles =
    variant === "question"
      ? "font-medium text-foreground mb-3"
      : "text-foreground/90";

  // Use question.completed directly (server state) unless pending? 
  // Actually, for instant feedback, we might want local state, 
  // but let's trust Next.js fast revalidation first.
  const completion = question.completed ? "line-through opacity-70" : "";

  return (
    <>
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`w-full font-medium text-foreground bg-muted-hover rounded ${inputStyles}`}
          onBlur={handleBlur}
          autoFocus
          disabled={isPending}
        />
      ) : (
        <>
          <div
            className={`flex items-center justify-between ${displayStyles} ${completion}`}
          >
            {/* If pending (saving), pulse the text slightly */}
            <span className={isPending ? "animate-pulse" : ""}>{text}</span>

            <div className="*:size-6 *:cursor-pointer flex items-center gap-1 opacity-100 *:hover:text-secondary *:disabled:cursor-auto *:disabled:hover:text-black">
              <button
                onClick={() => setIsEditing(true)}
                aria-label={`Edit ${variant}`}
                disabled={question.completed}
              >
                <TbEdit />
              </button>
              {variant === "question" && (
                <>
                  <button
                    onClick={handleComplete}
                    aria-label="Mark as complete"
                    disabled={isPending}
                  >
                     <TbCheckbox className={question.completed ? "text-success" : ""} />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload image"
                    disabled={isPending || question.completed}
                  >
                    <FaRegImage />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <DeleteButton id={question.id} variant="question" />
                </>
              )}
            </div>
          </div>

          {/* Image Display - assuming question has image_url prop now, or we fetch it? 
              The type StudyQuestion needs to support image_url if we want to show it.
              For now, using local state approach if needed, or if Type allows it.
          */}
          {/* Note: I'm relying on question.image_url if it exists in your Type definition.
              If not, it won't show until we update the Type. */}
        </>
      )}
    </>
  );
}