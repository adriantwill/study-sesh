export interface StudyQuestion {
  id: string;
  question: string;
  answer: string;
  completed: boolean;
  imageUrl?: string | null;
}
