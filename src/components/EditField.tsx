"use client";
import { Bold, Check, List, Highlighter, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  updateFolderNameAction,
  updateQuestionTextAction,
} from "../app/actions";
import { parseMarkdown } from "../lib/markdown";

interface EditFieldProps {
  variant: "question_text" | "answer_text" | "folder_name" | "filename" | "description" | 0 | 1 | 2;
  textField: string;
  id: string;
  onEditingChange?: (isEditing: boolean) => void;
  onSave?: (text: string) => void;
}

export default function EditField({
  variant,
  textField,
  id,
  onEditingChange,
  onSave,
}: EditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(textField);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(textField);
  }, [textField]);

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    if (variant !== "folder_name" && value.endsWith("- ")) {
      const newValue = `${value.slice(0, -2)}• `;
      setText(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = cursorPos;
      }, 0);
      return;
    }
    setText(value);
  }

  async function handleSave() {
    if (!isEditing) {
      setIsEditing(true);
      onEditingChange?.(true);
      return;
    }

    const nextText = text;

    setIsEditing(false);
    onEditingChange?.(false);

    if (nextText !== textField) {
      onSave?.(nextText);

      try {
        if (variant === "folder_name") {
          await updateFolderNameAction(id, nextText);
        } else {
          await updateQuestionTextAction(id, nextText, variant);
        }
      } catch (error) {
        console.error("Failed to save text:", error);
        setText(textField);
        onSave?.(textField);
      }
    }
  }

  function applyFormat(marker: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.slice(start, end);
    if (!selectedText) return;
    const nextText =
      text.slice(0, start) +
      `${marker}${selectedText}${marker}` +
      text.slice(end);

    setText(nextText);

    requestAnimationFrame(() => {
      textarea.focus();
      const selectionStart = start + marker.length;
      const selectionEnd = selectionStart + selectedText.length;
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function applyBulletList() {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;

    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const nextNewline = text.indexOf("\n", end);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;
    const selectedBlock = text.slice(lineStart, lineEnd);
    const bulletedBlock = selectedBlock
      .split("\n")
      .map((line) => (line.startsWith("• ") ? line : `• ${line}`))
      .join("\n");
    const nextText = text.slice(0, lineStart) + bulletedBlock + text.slice(lineEnd);

    setText(nextText);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + bulletedBlock.length);
    });
  }

  return (
    <>
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onPointerDown={(e) => e.stopPropagation()}
          rows={Math.max(1, text.split("\n").length)}
          className={`box-border h-full w-full resize-none rounded border border-border bg-transparent px-0 py-0 font-medium text-foreground focus:outline-none`}
        />
      ) : (
        <span className="box-border w-full whitespace-pre-wrap rounded border border-transparent px-0 py-0">
          {variant === "folder_name" ? text : parseMarkdown(text)}
        </span>
      )}
      <div className="flex items-center gap-2">
        {isEditing && variant === "answer_text" ? (
          <>
            <button
              type="button"
              onClick={applyBulletList}
              aria-label="Add bullets"
              className="flex items-center justify-center enabled:cursor-pointer enabled:hover:text-secondary"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("**")}
              aria-label="Bold text"
              className="flex items-center justify-center enabled:cursor-pointer enabled:hover:text-secondary"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("==")}
              aria-label="Highlight text"
              className="flex items-center justify-center enabled:cursor-pointer enabled:hover:text-secondary"
            >
              <Highlighter size={16} />
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={handleSave}
          aria-label={`Edit text`}
          className="flex items-center justify-center enabled:cursor-pointer enabled:hover:text-secondary "
        >
          {!isEditing ? <Pencil size={16} /> : <Check size={16} />}
        </button>
      </div>
    </>
  );
}
