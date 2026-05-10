import type { Database } from "./database.types";

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
export type DeleteButtonVariant =
	| "questions"
	| "table_uploads"
	| "uploads"
	| "folder";
export type ToolView = "flashcards" | "tables";

export const parentColumnByTable = {
	uploads: "folder_id",
	table_uploads: "folder_id",
	folders: "parent_id",
} as const satisfies Partial<{
	[T in keyof Database["public"]["Tables"]]: keyof Database["public"]["Tables"][T]["Row"];
}>;
