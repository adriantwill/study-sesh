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
}
