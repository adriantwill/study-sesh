"use server";

import { createClient } from "../lib/supabase/server";
import { revalidatePath } from "next/cache";

// --- EXISTING DELETE ACTION ---
export async function deleteItemAction(id: string, variant: "upload" | "question") {
  const supabase = await createClient();

  try {
    if (variant === "question") {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/review/[reviewId]", "page"); 
    } else {
      const { error } = await supabase.from("uploads").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/"); 
    }
  } catch (error) {
    console.error("Delete error:", error);
    throw new Error(`Failed to delete ${variant}`);
  }
}

// --- NEW ACTIONS ---

export async function updateQuestionTextAction(
  id: string, 
  text: string, 
  variant: "question" | "answer"
) {
  const supabase = await createClient();
  const field = variant === "question" ? "question_text" : "answer_text";

  const { error } = await supabase
    .from("questions")
    .update({ [field]: text })
    .eq("id", id);

  if (error) {
    console.error("Update text error:", error);
    throw new Error("Failed to update text");
  }

  revalidatePath("/review/[reviewId]", "page");
}

export async function toggleCompleteAction(id: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("questions")
    .update({ completed: !currentStatus })
    .eq("id", id);

  if (error) {
    console.error("Toggle complete error:", error);
    throw new Error("Failed to toggle completion status");
  }

  revalidatePath("/review/[reviewId]", "page");
}

export async function uploadImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  const questionId = formData.get("questionId") as string;

  if (!file || !questionId) return;

  // 1. Upload file
  const fileExt = file.name.split(".").pop();
  const fileName = `${questionId}_${Date.now()}.${fileExt}`;
  const filePath = `question-images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("question-images")
    .upload(filePath, file);

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error("Failed to upload image");
  }

  // 2. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from("question-images")
    .getPublicUrl(filePath);

  // 3. Update Question Record
  const { error: dbError } = await supabase
    .from("questions")
    .update({ image_url: publicUrl })
    .eq("id", questionId);

  if (dbError) {
    console.error("DB update error:", dbError);
    throw new Error("Failed to link image to question");
  }

  revalidatePath("/review/[reviewId]", "page");
}