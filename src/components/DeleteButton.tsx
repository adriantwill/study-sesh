"use client";

import { Trash2 } from "lucide-react";
import { deleteItemAction } from "../app/actions";

interface DeleteButtonProps {
  id: string;
  variant: "upload" | "question" | "folder";
  name: string
}

export default function DeleteButton({ id, variant, name }: DeleteButtonProps) {
  async function handleDelete() {
    const confirmed = confirm(`Delete this ${variant} "${name}"?`);
    if (confirmed) {
      await deleteItemAction(id, variant);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      aria-label={`Delete ${variant}`}
      className="flex items-center justify-center hover:text-secondary hover:cursor-pointer"
    >
      <Trash2 size={16} />
    </button>
  );
}
