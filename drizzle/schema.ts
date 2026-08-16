import { pgTable, unique, text, boolean, timestamp, index, foreignKey, uuid, check, integer, doublePrecision, jsonb, bigint, real } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean().notNull(),
	image: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	unique("user_email_key").on(table.email),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	ipAddress: text(),
	userAgent: text(),
	userId: text().notNull(),
}, (table) => [
	index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_userId_fkey"
		}).onDelete("cascade"),
	unique("session_token_key").on(table.token),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text().notNull(),
	providerId: text().notNull(),
	userId: text().notNull(),
	accessToken: text(),
	refreshToken: text(),
	idToken: text(),
	accessTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_userId_fkey"
		}).onDelete("cascade"),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const uploads = pgTable("uploads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").default(').notNull(),
	filename: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	folderId: uuid("folder_id"),
	description: text().default(').notNull(),
	storagePath: text("storage_path"),
	status: text().default('complete').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [folders.id],
			name: "uploads_folder_id_fkey"
		}).onDelete("set null"),
]);

export const folders = pgTable("folders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	parentId: uuid("parent_id"),
	userId: text("user_id").notNull(),
}, (table) => [
	index("folders_parent_id_idx").using("btree", table.parentId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "folders_parent_id_fkey"
		}).onDelete("set null"),
	check("folders_no_self_parent", sql`(parent_id IS NULL) OR (parent_id <> id)`),
]);

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	uploadId: uuid("upload_id").notNull(),
	questionText: text("question_text").notNull(),
	answerText: text("answer_text").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	imageUrl: text("image_url"),
	displayOrder: integer("display_order"),
	options: text().array().default([""]).notNull(),
	pageNumber: integer("page_number"),
	ocrText: text("ocr_text"),
	originalQuestionText: text("original_question_text"),
	deleted: boolean().default(false).notNull(),
	originalAnswerText: text("original_answer_text"),
	fsrsDifficulty: doublePrecision("fsrs_difficulty").notNull(),
	fsrsStability: doublePrecision("fsrs_stability").notNull(),
	fsrsReviewCount: doublePrecision("fsrs_review_count").notNull(),
	fsrsState: doublePrecision("fsrs_state").notNull(),
	fsrsScheduled: doublePrecision("fsrs_scheduled").notNull(),
	fsrsLearning: doublePrecision("fsrs_learning").default(sql`'0'`).notNull(),
	fsrsLapses: doublePrecision("fsrs_lapses").default(sql`'0'`).notNull(),
	fsrsDueAt: timestamp("fsrs_due_at", { withTimezone: true, mode: 'string' }).notNull(),
	fsrsLastReviewedAt: timestamp("fsrs_last_reviewed_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.uploadId],
			foreignColumns: [uploads.id],
			name: "questions_upload_id_fkey"
		}).onDelete("cascade"),
]);

export const tableUploads = pgTable("table_uploads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	filename: text().notNull(),
	folderId: uuid("folder_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	userId: text("user_id").notNull(),
	parsedData: jsonb("parsed_data"),
}, (table) => [
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [folders.id],
			name: "table_uploads_folder_id_fkey"
		}).onDelete("set null"),
]);

export const deadlines = pgTable("deadlines", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "deadlines_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userId: text("user_id"),
	title: text(),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
});

export const events = pgTable("events", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({ name: "events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	questionId: uuid("question_id").notNull(),
	eventType: text("event_type").notNull(),
	rating: integer(),
	difficulty: real().notNull(),
	stability: real().notNull(),
	beforeDifficulty: real("before_difficulty"),
	beforeStability: real("before_stability"),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "events_question_id_fkey"
		}).onDelete("cascade"),
]);
