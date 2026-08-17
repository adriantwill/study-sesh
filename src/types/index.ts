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
export type databaseDelete =
	| typeof tableUploads
	| typeof questions
	| typeof folders
	| typeof uploads;
export type DeleteItemName =
	| "table_uploads"
	| "questions"
	| "folders"
	| "uploads";

type QuestionInsert = typeof questions.$inferInsert;
type UploadInsert = typeof uploads.$inferInsert;
type FolderInsert = typeof folders.$inferInsert;
type DeadlineInsert = typeof deadlines.$inferInsert;
type TableUploadInsert = typeof tableUploads.$inferInsert;

type TextUpdateRows = {
	questions: Pick<QuestionInsert, "questionText" | "answerText">;
	uploads: Pick<UploadInsert, "filename" | "description">;
	folders: Pick<FolderInsert, "name">;
	deadlines: Pick<DeadlineInsert, "title">;
};

export type TextUpdateTable = keyof TextUpdateRows;
export type TextUpdateColumn<T extends TextUpdateTable> = Extract<
	keyof TextUpdateRows[T],
	string
>;

type ParentUpdateRows = {
	uploads: Pick<UploadInsert, "folderId">;
	tableUploads: Pick<TableUploadInsert, "folderId">;
	folders: Pick<FolderInsert, "parentId">;
};

export type ParentUpdateTable = keyof ParentUpdateRows;
export type ParentUpdateColumn<T extends ParentUpdateTable> = Extract<
	keyof ParentUpdateRows[T],
	string
>;

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
