export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  options?: string[];
  imageUrl?: string | null;
  displayOrder?: number | null;
}
