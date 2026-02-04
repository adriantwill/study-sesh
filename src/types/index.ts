export interface StudyQuestion {
	id: string;
	question: string;
	answer: string;
	imageUrl?: string | null;
	displayOrder?: number | null;
}
