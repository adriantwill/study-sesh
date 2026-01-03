"use client";

import { useFormStatus } from "react-dom";
import { TbTrash } from "react-icons/tb";
import { deleteItemAction } from "../app/actions";

interface DeleteButtonProps {
  id: string;
  variant: "upload" | "question";
}

function SubmitButton({ variant }: { variant: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Delete ${variant}`}
      className="hover:text-secondary enabled:hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <TbTrash className={pending ? "animate-pulse" : ""} />
    </button>
  );
}

export default function DeleteButton({ id, variant }: DeleteButtonProps) {
  const deleteAction = deleteItemAction.bind(null, id, variant);

  return (
    <form action={deleteAction}>
      <SubmitButton variant={variant} />
    </form>
  );
}