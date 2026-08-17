import type {
	deadlines,
	events,
	folders,
	questions,
	tableUploads,
	uploads,
} from "@/drizzle/schema";

export type Folder = typeof folders.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Table = typeof tableUploads.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
export type Deadline = typeof deadlines.$inferSelect;
export type EventInsert = typeof events.$inferInsert;
export type DeleteItemName =
	| "table_uploads"
	| "questions"
	| "folders"
	| "uploads";

export type ParentTable = "uploads" | "table_uploads" | "folders";
export type ReorderQuestion = Pick<
	StudyQuestion,
	"id" | "displayOrder" | "upload_id"
>;
export type Temp =
	| typeof uploads
	| typeof folders
	| typeof tableUploads
	| typeof questions
	| typeof deadlines;
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
	fsrsDifficulty: number;
	fsrsStability: number;
	fsrsDue: Date;
	fsrsLastReviewed: Date;
	fsrsReviewCount: number;
	fsrsState: number;
	fsrsScheduled: number;
	fsrsLearning: number;
	fsrsLapses: number;
}
export type ToolView = "flashcards" | "tables";
