"use client";
import { useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { TbTrash } from "react-icons/tb";

interface DeleteButtonProps {
  id: string;
  variant: "upload" | "question";
}

export default function DeleteButton({ id, variant }: DeleteButtonProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteItem = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      if (variant === "question") {
        const { error } = await supabase
          .from("questions")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error: uploadError } = await supabase
          .from("uploads")
          .delete()
          .eq("id", id);
        if (uploadError) throw uploadError;
      }
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Failed to delete ${variant}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={deleteItem}
      disabled={isDeleting}
      aria-label={`Delete ${variant}`}
      className="hover:text-secondary enabled:hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <TbTrash />
    </button>
  );
}
