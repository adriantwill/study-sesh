import { Trash2 } from "lucide-react";
import { deleteItemAction } from "../app/actions";

interface DeleteButtonProps {
  id: string;
  variant: "upload" | "question";
}

export default function DeleteButton({ id, variant }: DeleteButtonProps) {
  const deleteAction = deleteItemAction.bind(null, id, variant);

  return (
    <form action={deleteAction} className="flex items-center">
      <button
        type="submit"
        aria-label={`Delete ${variant}`}
        className="flex items-center justify-center hover:text-secondary enabled:hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </form>
  );
}
