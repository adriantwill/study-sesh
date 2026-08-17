"use server";

export {
	addDeadlineAction,
	addFolderAction,
	addQuestionAction,
	addTelemetry,
	createUpload,
	deleteDeadlineAction,
	deleteItemAction,
	generateWrongOptionsAction,
	normalizeQuestionDisplayOrder,
	reorderQuestionsAction,
	updateDeadlineDueDateAction,
	updateDeadlineTitleAction,
	updateFsrsAction,
	updateParentAction,
	updateQuestionTextAction,
	updateTableCellAction,
	uploadAndGenerateAction,
	uploadImageAction,
	uploadTableAction,
} from "@/src/db/queries";
