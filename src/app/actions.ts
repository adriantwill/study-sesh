"use server";

import { revalidatePath } from "next/cache";
import { generateQuestions } from "../lib/ai/question-generator";
import { getPublicUrl, uploadFile } from "../lib/storage";
import { createClient } from "../lib/supabase/server";

export async function uploadAndGenerateAction(formData: FormData) {
  const file = formData.get("pdf") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  const questions = await generateQuestions(file);
  const supabase = await createClient();

  // Insert upload record
  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .insert({
      filename: file.name,
    })
    .select()
    .single();

  if (uploadError || !upload) {
    console.error("Error inserting upload:", uploadError);
    throw new Error("Failed to save upload to database");
  }

  // Insert questions
  if (questions.length > 0) {
    const { error: questionsError } = await supabase.from("questions").insert(
      questions.map((q, idx) => ({
        upload_id: upload.id,
        question_text: q.question,
        answer_text: q.answer,
        display_order: idx + 1,
      })),
    );

    if (questionsError) {
      console.error("Error inserting questions:", questionsError);
      // Optional: Cleanup upload if questions fail? For now, just throw.
      throw new Error("Failed to save questions to database");
    }
  }

  revalidatePath("/");
  return { uploadId: upload.id };
}

export async function deleteItemAction(
  id: string,
  variant: "folder" | "upload" | "question",
) {
  const supabase = await createClient();

  try {
    if (variant === "question") {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/[reviewId]", "page");
    } else if (variant === "folder") {
      const { count } = await supabase
        .from("uploads")
        .select("*", { count: "exact", head: true })
        .eq("folder_id", id);

      if (count && count > 0) {
        throw new Error("Folder not empty");
      }

      const { error } = await supabase.from("folders").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/");
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

export async function updateQuestionTextAction(
  id: string,
  text: string,
  variant: "question_text" | "answer_text" | "filename" | "description",
) {
  const supabase = await createClient();
  const database = variant === "filename" || variant === "description" ? "uploads" : "questions";

  const { error } = await supabase
    .from(database)
    .update({ [variant]: text })
    .eq("id", id);

  if (error) {
    console.error("Update text error:", error);
    throw new Error("Failed to update text");
  }
  //change type
  revalidatePath("/[reviewId]", "page");
}

export async function uploadImageAction(
  questionId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const file = formData.get("file") as File;

  if (!file || !questionId) return;

  const fileExt = file.name.split(".").pop();
  const fileName = `${questionId}_${Date.now()}.${fileExt}`;
  const filePath = `question-images/${fileName}`;

  const { error: uploadError } = await uploadFile(filePath, file);

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error("Failed to upload image");
  }

  const publicUrl = await getPublicUrl(filePath);

  const { error: dbError } = await supabase
    .from("questions")
    .update({ image_url: publicUrl })
    .eq("id", questionId);

  if (dbError) {
    console.error("DB update error:", dbError);
    throw new Error("Failed to link image to question");
  }

  revalidatePath("/[reviewId]", "page");
}

export async function addQuestionAction(
  uploadId: string,
  question: string,
  answer: string,
  insertAtPosition: number,
) {
  const supabase = await createClient();

  // Shift existing questions at/after position
  const { data: toShift } = await supabase
    .from("questions")
    .select("id, display_order")
    .eq("upload_id", uploadId)
    .gte("display_order", insertAtPosition)
    .order("display_order", { ascending: false });

  if (toShift) {
    for (const q of toShift) {
      await supabase
        .from("questions")
        .update({ display_order: (q.display_order ?? 0) + 1 })
        .eq("id", q.id);
    }
  }

  const { error } = await supabase.from("questions").insert({
    upload_id: uploadId,
    question_text: question,
    answer_text: answer,
    display_order: insertAtPosition,
  });

  if (error) {
    console.error("Add question error:", error);
    throw new Error("Failed to add question");
  }

  revalidatePath("/[reviewId]", "page");
}

export async function addFolderAction(name: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("folders").insert({
    name,
  });

  if (error) {
    console.error("Add folder error:", error);
    throw new Error("Failed to add folder");
  }

  revalidatePath("/");
}

export async function updateUploadFolderAction(
  uploadId: string,
  folderId: string | null,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("uploads")
    .update({ folder_id: folderId })
    .eq("id", uploadId);

  if (error) {
    console.error("Update folder error:", error);
    throw new Error("Failed to update folder");
  }

  revalidatePath("/");
}

export async function reorderQuestionsAction(orderedIds: string[]) {
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("questions")
      .update({ display_order: i + 1 })
      .eq("id", orderedIds[i]);
  }

  revalidatePath("/[reviewId]", "page");
}

export async function updateFolderNameAction(folderId: string, name: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", folderId);

  if (error) {
    console.error("Update folder name error:", error);
    throw new Error("Failed to update folder name");
  }

  revalidatePath("/");
}
