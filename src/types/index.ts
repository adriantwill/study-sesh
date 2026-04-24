export interface StudyQuestion {
  id: string;
  upload_id: string;
  question: string;
  answer: string;
  options?: string[];
  imageUrl?: string | null;
  displayOrder: number;
  pageNumber?: number | null;
  ocrText?: string | null;
  originalQuestion?: string | null;
  originalAnswer?: string | null;
}
export type EditFieldVariant = "question_text" | "answer_text" | "folder_name" | "filename" | "description"
export type DeleteButtonVariant = "question" | "upload" | "folder"
