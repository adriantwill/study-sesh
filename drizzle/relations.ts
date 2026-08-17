import { relations } from "drizzle-orm/relations";
import {
	account,
	events,
	folders,
	questions,
	session,
	tableUploads,
	uploads,
	user,
} from "./schema";

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const uploadsRelations = relations(uploads, ({ one, many }) => ({
	folder: one(folders, {
		fields: [uploads.folderId],
		references: [folders.id],
	}),
	questions: many(questions),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
	uploads: many(uploads),
	folder: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: "folders_parentId_folders_id",
	}),
	folders: many(folders, {
		relationName: "folders_parentId_folders_id",
	}),
	tableUploads: many(tableUploads),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
	upload: one(uploads, {
		fields: [questions.uploadId],
		references: [uploads.id],
	}),
	events: many(events),
}));

export const tableUploadsRelations = relations(tableUploads, ({ one }) => ({
	folder: one(folders, {
		fields: [tableUploads.folderId],
		references: [folders.id],
	}),
}));

export const eventsRelations = relations(events, ({ one }) => ({
	question: one(questions, {
		fields: [events.questionId],
		references: [questions.id],
	}),
}));
