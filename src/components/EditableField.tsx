"use client";

import { useState, useMemo, useRef } from "react";
import { StudyQuestion } from "../types";
import { createClient } from "../lib/supabase/client";
import { TbCheckbox, TbEdit } from "react-icons/tb";
import DeleteButton from "./DeleteButton";
import { FaRegImage } from "react-icons/fa6";

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
  const [complete, setComplete] = useState<"" | "line-through opacity-70">(
    question.completed === true ? "line-through opacity-70" : "",
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const handleBlur = async () => {
    setIsEditing(false);
    const field = `${variant}_text`;
    await supabase
      .from("questions")
      .update({ [field]: text })
      .eq("id", question.id);
  };
  const completeQuestion = async () => {
    setComplete((prev) => (prev === "" ? "line-through opacity-70" : ""));
    await supabase
      .from("questions")
      .update({
        completed: complete === "line-through opacity-70" ? false : true,
      })
      .eq("id", question.id);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${question.id}_${Date.now()}.${fileExt}`;
      const filePath = `question-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("question-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("question-images").getPublicUrl(filePath);

      await supabase
        .from("questions")
        .update({ image_url: publicUrl })
        .eq("id", question.id);

      alert("Image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const inputStyles =
    variant === "question" ? "mb-3  px-3 py-2 " : " px-2 py-1 ";

  const displayStyles =
    variant === "question"
      ? " font-medium text-foreground mb-3"
      : "  text-foreground/90";

  return (
    <>
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={` w-full font-medium text-foreground bg-muted-hover rounded ${inputStyles} ${complete}`}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <div
          className={`flex items-center justify-between ${displayStyles} ${complete}`}
        >
          {text}

          <div className="*:size-6 *:cursor-pointer flex items-center gap-1 *:hover:text-secondary *:disabled:cursor-auto">
            <button
              onClick={() => setIsEditing(true)}
              aria-label={`Edit ${variant}`}
              disabled={complete === "line-through opacity-70"}
            >
              <TbEdit />
            </button>
            {variant === "question" && (
              <>
                <button
                  onClick={() => completeQuestion()}
                  aria-label="Mark as complete"
                >
                  <TbCheckbox />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload image"
                  disabled={uploading}
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
      )}
    </>
  );
}
