"use client";

import { Trash2 } from "lucide-react";
import { deleteItemAction } from "../app/actions";
import { DeleteButtonVariant } from "../types";

interface DeleteButtonProps {
  id: string;
  variant: DeleteButtonVariant;
  name: string;
  displayElement?: () => Promise<void> | void;
}

export default function DeleteButton({
  id,
  variant,
  name,
  displayElement,
}: DeleteButtonProps) {
  async function handleDelete() {
    const confirmed = confirm(`Delete this ${variant} "${name}"?`);
    if (confirmed) {
      if (displayElement) {
        displayElement();
      }
      await deleteItemAction(id, variant);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      aria-label={`Delete ${variant}`}
      className="flex items-center justify-center hover:cursor-pointer hover:text-primary"
    >
      <Trash2 size={16} />
    </button>
  );
}
