"use client";
import { PiTrash } from "react-icons/pi";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
  variant: "upload" | "question";
}

export default function DeleteButton({ id, variant }: DeleteButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const deleteQuestion = async () => {
    if (variant === "question") {
      await supabase.from("questions").delete().eq("id", id);
    } else {
      await supabase.from("uploads").delete().eq("id", id);
      await supabase.from("questions").delete().eq("upload_id", id);
    }
    router.refresh();
  };

  return <PiTrash onClick={deleteQuestion} className=" hover:text-red-700" />;
}
