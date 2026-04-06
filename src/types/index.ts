export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  options?: string[];
  imageUrl?: string | null;
  displayOrder?: number | null;
  pageNumber?: number | null;
  ocrText?: string | null;
  originalQuestion?: string | null;
}
