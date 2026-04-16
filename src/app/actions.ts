"use server";

import { revalidatePath } from "next/cache";
import { generateQuestions } from "../lib/ai/question-generator";
import {
  getQuestionImagePublicUrl,
  removePdf,
  uploadPdf,
  uploadQuestionImage,
} from "../lib/storage";
import { createClient } from "../lib/supabase/server";
import type { StudyQuestion } from "../types";

const DISPLAY_ORDER_STEP = 100;

async function normalizeQuestionDisplayOrder(uploadId: string) {
  const supabase = await createClient();
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id")
    .eq("upload_id", uploadId)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("Normalize order fetch error:", error);
    throw new Error("Failed to normalize question order");
  }

  for (const [index, question] of (questions ?? []).entries()) {
    const { error: updateError } = await supabase
      .from("questions")
      .update({ display_order: (index + 1) * DISPLAY_ORDER_STEP })
      .eq("id", question.id);

    if (updateError) {
      console.error("Normalize order update error:", updateError);
      throw new Error("Failed to normalize question order");
    }
  }
}

export async function uploadAndGenerateAction(formData: FormData) {
  const file = formData.get("pdf") as File;
  if (!file) {
    throw new Error("No file provided");
  }
  const questions = await generateQuestions(file);
  const upload = await uploadRecordAction(file, questions);
  revalidatePath("/");
  return { uploadId: upload.id };
}

export async function uploadRecordAction(
  source: File | string,
  questions: StudyQuestion[],
) {
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
  variant: "folder" | "upload" | "question",
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
  variant: "question_text" | "answer_text" | "filename" | "description" | 0 | 1 | 2,
) {
  const supabase = await createClient();

  if (variant === 0 || variant === 1 || variant === 2) {
    const { data, error: fetchError } = await supabase
      .from("questions")
      .select("options")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Update options fetch error:", fetchError);
      throw new Error("Failed to load options");
    }

    const updatedOptions = [...(data.options ?? [])];
    updatedOptions[variant] = text;

    const { error: optionError } = await supabase
      .from("questions")
      .update({ options: updatedOptions })
      .eq("id", id);

    if (optionError) {
      console.error("Update option error:", optionError);
      throw new Error("Failed to update option");
    }
  } else {
    const database =
      variant === "filename" || variant === "description"
        ? "uploads"
        : "questions";

    const { error } = await supabase
      .from(database)
      .update({ [variant]: text })
      .eq("id", id);

    if (error) {
      console.error("Update text error:", error);
      throw new Error("Failed to update text");
    }
  }

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
) {
  const supabase = await createClient();
  const nextDisplayOrder =
    insertAtPosition <= 0
      ? DISPLAY_ORDER_STEP
      : Math.ceil((insertAtPosition + DISPLAY_ORDER_STEP) / DISPLAY_ORDER_STEP) *
      DISPLAY_ORDER_STEP;

  const { data: rowsToShift, error: rowsError } = await supabase
    .from("questions")
    .select("id, display_order")
    .eq("upload_id", uploadId)
    .gte("display_order", nextDisplayOrder)
    .order("display_order", { ascending: false });

  if (rowsError) {
    console.error("Add question fetch error:", rowsError);
    throw new Error("Failed to load question positions");
  }

  if (rowsToShift) {
    for (const row of rowsToShift) {
      const currentDisplayOrder = row.display_order ?? 0;
      const { error: shiftError } = await supabase
        .from("questions")
        .update({ display_order: currentDisplayOrder + DISPLAY_ORDER_STEP })
        .eq("id", row.id);

      if (shiftError) {
        console.error("Add question shift error:", shiftError);
        throw new Error("Failed to make room for question");
      }
    }
  }

  const { data: insertedQuestion, error } = await supabase
    .from("questions")
    .insert({
      upload_id: uploadId,
      question_text: "Untitled Question",
      original_question_text: "User Added Question",
      answer_text: "Untitled Answer",
      page_number: null,
      ocr_text: null,
      display_order: nextDisplayOrder,
    } as never)
    .select("*")
    .single();

  if (error || !insertedQuestion) {
    console.error("Add question error:", error);
    throw new Error("Failed to add question");
  }

  const { data: existingOrders, error: existingOrdersError } = await supabase
    .from("questions")
    .select("display_order")
    .eq("upload_id", uploadId);

  if (existingOrdersError) {
    console.error("Add question existing order error:", existingOrdersError);
    throw new Error("Failed to load existing question positions");
  }

  const hasInvalidDisplayOrder = (existingOrders ?? []).some((row) => {
    const displayOrder = row.display_order;
    return displayOrder == null || displayOrder % DISPLAY_ORDER_STEP !== 0;
  });

  if (hasInvalidDisplayOrder) {
    await normalizeQuestionDisplayOrder(uploadId);
  }

  revalidatePath(`/${uploadId}`);

  return {
    id: insertedQuestion.id,
    upload_id: insertedQuestion.upload_id ?? uploadId,
    question: insertedQuestion.question_text,
    answer: insertedQuestion.answer_text,
    imageUrl: insertedQuestion.image_url,
    displayOrder: insertedQuestion.display_order,
    options: insertedQuestion.options,
    pageNumber: "page_number" in insertedQuestion ? insertedQuestion.page_number : null,
    ocrText: "ocr_text" in insertedQuestion ? insertedQuestion.ocr_text : null,
    originalQuestion:
      insertedQuestion.original_question_text ?? insertedQuestion.question_text,
  };
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
