"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { generateQuestions } from "../lib/ai/question-generator";
import {
  getQuestionImagePublicUrl,
  removePdf,
  uploadPdf,
  uploadQuestionImage,
} from "../lib/storage";
import { createClient } from "../lib/supabase/server";
import type { DeleteButtonVariant, EditFieldVariant, StudyQuestion } from "../types";

const DISPLAY_ORDER_STEP = 100;

export async function normalizeQuestionDisplayOrder(uploadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("normalize_question_display_order", {
    p_upload_id: uploadId,
  });
  if (error) throw new Error("Failed to normalize question order");
}

export async function uploadAndGenerateAction(formData: FormData) {
  const file = formData.get("pdf") as File;
  if (!(file instanceof File) || file.size === 0) throw new Error("No PDF provided");
  if (file.type !== "application/pdf") throw new Error("Only PDFs supported");
  const questions = await generateQuestions(file);
  if (questions.length === 0) {
    throw new Error("No questions generated from this PDF");
  }
  const upload = await uploadRecordAction(file, questions);
  revalidatePath("/");
  return { uploadId: upload.id };
}

export async function uploadRecordAction(
  source: File | string,
  questions: StudyQuestion[],
) {
  if (questions.length === 0) {
    throw new Error("No questions to save");
  }

  const supabase = await createClient();
  const isFileUpload = source instanceof File;
  const filename = isFileUpload ? source.name : source;
  let storagePath: string | null = null;

  if (isFileUpload) {
    const safeName = source.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    storagePath = `${crypto.randomUUID()}-${safeName}`;

    const { error: storageError } = await uploadPdf(storagePath, source);

    if (storageError) {
      console.error("Error uploading PDF:", storageError);
      throw new Error("Failed to save PDF to storage");
    }
  }

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .insert({
      filename,
      storage_path: storagePath,
    })
    .select()
    .single();

  if (uploadError || !upload) {
    console.error("Error inserting upload:", uploadError);
    if (storagePath) {
      await removePdf(storagePath);
    }
    throw new Error("Failed to save upload to database");
  }

  // Insert questions
  if (questions.length > 0) {
    const questionRows = questions.map((q, idx) => ({
      upload_id: upload.id,
      question_text: q.question,
      original_question_text: q.originalQuestion ?? q.question,
      answer_text: q.answer,
      page_number: q.pageNumber ?? null,
      ocr_text: q.ocrText ?? null,
      display_order: (idx + 1) * DISPLAY_ORDER_STEP,
      options: q.options ?? [],
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionRows as never);

    if (questionsError) {
      console.error("Error inserting questions:", questionsError);
      await supabase.from("uploads").delete().eq("id", upload.id);
      if (storagePath) {
        await removePdf(storagePath);
      }
      throw new Error("Failed to save questions to database");
    }

  }
  return upload;
}

export async function deleteItemAction(
  id: string,
  variant: DeleteButtonVariant,
) {
  const supabase = await createClient();

  try {
    if (variant === "question") {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/[reviewId]", "page");
    } else if (variant === "folder") {
      const { error: detachError } = await supabase
        .from("uploads")
        .update({ folder_id: null })
        .eq("folder_id", id);

      if (detachError) throw detachError;

      const { error: detachFoldersError } = await supabase
        .from("folders")
        .update({ parent_id: null } as never)
        .eq("parent_id", id);

      if (detachFoldersError) throw detachFoldersError;

      const { error } = await supabase.from("folders").delete().eq("id", id);
      if (error) throw error;
      revalidatePath("/");
    } else {
      const { data: upload } = await supabase
        .from("uploads")
        .select("storage_path")
        .eq("id", id)
        .single();

      const { error: deleteQuestionsError } = await supabase
        .from("questions")
        .delete()
        .eq("upload_id", id);

      if (deleteQuestionsError) throw deleteQuestionsError;

      const { error } = await supabase.from("uploads").delete().eq("id", id);
      if (error) throw error;

      if (upload?.storage_path) {
        await removePdf(upload.storage_path);
      }

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
  variant: EditFieldVariant,
) {
  const supabase = await createClient();
  const variantConfig: Record<
    EditFieldVariant,
    {
      table: "uploads" | "questions" | "folders";
      column: string;
    }
  > = {
    filename: { table: "uploads", column: "filename" },
    description: { table: "uploads", column: "description" },
    folder_name: { table: "folders", column: "name" },
    question_text: { table: "questions", column: "question_text" },
    answer_text: { table: "questions", column: "answer_text" },
  };
  const { table, column } = variantConfig[variant];

  // if (variant === 0 || variant === 1 || variant === 2) {
  //   const { data, error: fetchError } = await supabase
  //     .from("questions")
  //     .select("options")
  //     .eq("id", id)
  //     .single();

  //   if (fetchError) {
  //     console.error("Update options fetch error:", fetchError);
  //     throw new Error("Failed to load options");
  //   }

  //   const updatedOptions = [...(data.options ?? [])];
  //   updatedOptions[variant] = text;

  //   const { error: optionError } = await supabase
  //     .from("questions")
  //     .update({ options: updatedOptions })
  //     .eq("id", id);

  //   if (optionError) {
  //     console.error("Update option error:", optionError);
  //     throw new Error("Failed to update option");
  //   }
  // } else {
  const { error } = await supabase
    .from(table)
    .update({ [column]: text })
    .eq("id", id);

  if (error) {
    console.error("Update text error:", error);
    throw new Error("Failed to update text");
  }
  // }

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

  const { error: uploadError } = await uploadQuestionImage(filePath, file);

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error("Failed to upload image");
  }

  const publicUrl = await getQuestionImagePublicUrl(filePath);

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
  insertAtPosition: number,
  prevDisplayOrder?: number | null,
  nextDisplayOrder?: number | null,
) {
  const supabase = await createClient();
  void insertAtPosition;

  const getDisplayOrder = (prevOrder?: number | null, nextOrder?: number | null) => {
    if (prevOrder == null) return Math.floor((nextOrder ?? DISPLAY_ORDER_STEP) / 2);
    if (nextOrder == null) return prevOrder + DISPLAY_ORDER_STEP;
    return Math.floor((prevOrder + nextOrder) / 2);
  };

  const displayOrder = getDisplayOrder(prevDisplayOrder, nextDisplayOrder);

  const { data: insertedQuestion, error } = await supabase
    .from("questions")
    .insert({
      upload_id: uploadId,
      question_text: "Untitled Question",
      original_question_text: "User Added Question",
      answer_text: "Untitled Answer",
      page_number: null,
      ocr_text: null,
      display_order: displayOrder,
    } as never)
    .select("id")
    .single();

  if (error || !insertedQuestion) {
    console.error("Add question error:", error);
    throw new Error("Failed to add question");
  }
  revalidatePath(`/${uploadId}`);
  if (
    prevDisplayOrder != null &&
    nextDisplayOrder != null &&
    displayOrder === prevDisplayOrder + 1
  ) {
    after(async () => {
      try {
        await normalizeQuestionDisplayOrder(uploadId);
        revalidatePath(`/${uploadId}`);
      } catch (error) {
        console.error("Background normalize question order error:", error);
      }
    });
  }
}

export async function addFolderAction() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name: "Untitled Folder",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Add folder error:", error);
    throw new Error("Failed to add folder");
  }

  revalidatePath("/");

  return data;
}

export async function updateParentAction(
  id: string,
  parentId: string | null,
  variant: "upload" | "folder",
) {
  const supabase = await createClient();
  const table = variant === "upload" ? "uploads" : "folders";
  const column = variant === "upload" ? "folder_id" : "parent_id";

  const { error } = await supabase
    .from(table)
    .update({ [column]: parentId } as never)
    .eq("id", id);

  if (error) {
    console.error("Update parent error:", error);
    throw new Error(`Failed to update ${variant} parent`);
  }

  revalidatePath("/");
}

export async function reorderQuestionsAction(activeId: string, questions: StudyQuestion[]) {
  if (questions.length === 0) return;

  const supabase = await createClient();
  const activeIndex = questions.findIndex((question) => question.id === activeId);

  if (activeIndex === -1) {
    throw new Error("Question not found");
  }

  const activeQuestion = questions[activeIndex];
  const prevQuestion = activeIndex > 0 ? questions[activeIndex - 1] : null;
  const nextQuestion = activeIndex < questions.length - 1 ? questions[activeIndex + 1] : null;

  const getDisplayOrder = (prevOrder?: number | null, nextOrder?: number | null) => {
    if (prevOrder == null) return Math.floor((nextOrder ?? DISPLAY_ORDER_STEP) / 2);
    if (nextOrder == null) return prevOrder + DISPLAY_ORDER_STEP;
    return Math.floor((prevOrder + nextOrder) / 2);
  };

  let nextDisplayOrder = getDisplayOrder(
    prevQuestion?.displayOrder,
    nextQuestion?.displayOrder,
  );

  if (
    prevQuestion &&
    nextQuestion &&
    nextDisplayOrder === prevQuestion.displayOrder + 1
  ) {
    await normalizeQuestionDisplayOrder(activeQuestion.upload_id);

    const { data: normalizedNeighbors, error: normalizedNeighborsError } = await supabase
      .from("questions")
      .select("id, display_order")
      .in("id", [prevQuestion.id, nextQuestion.id]);

    if (normalizedNeighborsError) {
      console.error("Reorder normalized neighbor fetch error:", normalizedNeighborsError);
      throw new Error("Failed to load normalized question positions");
    }

    nextDisplayOrder = getDisplayOrder(
      normalizedNeighbors?.find((question) => question.id === prevQuestion.id)?.display_order,
      normalizedNeighbors?.find((question) => question.id === nextQuestion.id)?.display_order,
    );

    if (nextDisplayOrder <= 0) {
      throw new Error("Failed to load normalized question positions");
    }
  }

  const { error } = await supabase
    .from("questions")
    .update({ display_order: nextDisplayOrder })
    .eq("id", activeId);

  if (error) {
    console.error("Reorder question error:", error);
    throw new Error("Failed to reorder questions");
  }

  revalidatePath(`/${activeQuestion.upload_id}`);
}
