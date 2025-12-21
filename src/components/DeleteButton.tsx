"use client";
import { PiTrash } from "react-icons/pi";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
}

export default function DeleteButton({ id }: DeleteButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const deleteQuestion = async () => {
    await supabase.from("uploads").delete().eq("id", id);
    await supabase.from("questions").delete().eq("upload_id", id);
    router.refresh();
  };

  return <PiTrash onClick={deleteQuestion} className=" hover:text-red-700" />;
}
