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
	Question,
	"id" | "displayOrder" | "uploadId"
>;
export type Temp =
	| typeof uploads
	| typeof folders
	| typeof tableUploads
	| typeof questions
	| typeof deadlines;
export type ToolView = "flashcards" | "tables";
