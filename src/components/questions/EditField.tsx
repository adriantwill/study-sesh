"use client";
import { Bold, Check, Highlighter, List, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	updateDeadlineTitleAction,
	updateQuestionTextAction,
} from "@/src/app/actions";
import { parseMarkdown } from "@/src/lib/markdown";
import type { Database } from "@/src/types/database.types";

type PublicTables = Database["public"]["Tables"];
type EditFieldTable = keyof PublicTables;
type EditFieldColumn<T extends EditFieldTable> = keyof PublicTables[T]["Row"];
const iconButtonClass =
	"flex items-center justify-center enabled:cursor-pointer enabled:hover:text-primary";

interface EditFieldProps<T extends EditFieldTable> {
	table: T;
	col: EditFieldColumn<T>;
	textField: string;
	id: string;
	onEditingChange?: (isEditing: boolean) => void;
	openFolder?: () => void;
}

export default function EditField<T extends EditFieldTable>({
	textField,
	id,
	onEditingChange,
	table,
	col,
	openFolder,
}: EditFieldProps<T>) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(textField);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const isFolderName = table === "folders" && col === "name";
	const isAnswerText = table === "questions" && col === "answer_text";
	const isDeadlineTitle = table === "deadlines" && col === "title";

	useEffect(() => {
		setText(textField);
	}, [textField]);

	function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const value = e.target.value;
		const cursorPos = e.target.selectionStart;

		if (!isAnswerText && value.endsWith("- ")) {
			const newValue = `${value.slice(0, -2)}• `;
			setText(newValue);
			setTimeout(() => {
				e.target.selectionStart = e.target.selectionEnd = cursorPos;
			}, 0);
			return;
		}
		setText(value);
	}

	async function handleSave() {
		if (!isEditing) {
			setIsEditing(true);
			onEditingChange?.(true);
			return;
		}

		const nextText = text;

		setIsEditing(false);
		onEditingChange?.(false);

		if (nextText !== textField) {
			try {
				if (isDeadlineTitle) {
					await updateDeadlineTitleAction(Number(id), nextText);
				} else {
					await updateQuestionTextAction(id, nextText, table, col);
				}
			} catch (error) {
				console.error("Failed to save text:", error);
				setText(textField);
			}
		}
	}

	function applyFormat(marker: string) {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = text.slice(start, end);
		if (!selectedText) return;
		const nextText =
			text.slice(0, start) +
			`${marker}${selectedText}${marker}` +
			text.slice(end);

		setText(nextText);

		requestAnimationFrame(() => {
			textarea.focus();
			const selectionStart = start + marker.length;
			const selectionEnd = selectionStart + selectedText.length;
			textarea.setSelectionRange(selectionStart, selectionEnd);
		});
	}

	function applyBulletList() {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		if (start === end) return;

		const lineStart = text.lastIndexOf("\n", start - 1) + 1;
		const nextNewline = text.indexOf("\n", end);
		const lineEnd = nextNewline === -1 ? text.length : nextNewline;
		const selectedBlock = text.slice(lineStart, lineEnd);
		const bulletedBlock = selectedBlock
			.split("\n")
			.map((line) => (line.startsWith("• ") ? line : `• ${line}`))
			.join("\n");
		const nextText =
			text.slice(0, lineStart) + bulletedBlock + text.slice(lineEnd);

		setText(nextText);

		requestAnimationFrame(() => {
			textarea.focus();
			textarea.setSelectionRange(lineStart, lineStart + bulletedBlock.length);
		});
	}

	return (
		<>
			{isEditing ? (
				<textarea
					ref={textareaRef}
					value={text}
					onChange={handleTextChange}
					onPointerDown={(e) => e.stopPropagation()}
					rows={Math.max(1, text.split("\n").length)}
					className="box-border h-full w-full resize-none rounded border border-border bg-transparent px-0 py-0 font-medium text-foreground focus:outline-none"
				/>
			) : (
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						openFolder?.();
					}}
					className={`box-border w-full text-left whitespace-pre-wrap rounded border border-transparent ${openFolder ? "cursor-pointer" : ""}`}
				>
					{isFolderName ? text : parseMarkdown(text)}
				</button>
			)}
			<div className="flex items-center gap-2">
				{isEditing && isAnswerText ? (
					<>
						<button
							type="button"
							onClick={applyBulletList}
							aria-label="Add bullets"
							className={iconButtonClass}
						>
							<List size={16} />
						</button>
						<button
							type="button"
							onClick={() => applyFormat("**")}
							aria-label="Bold text"
							className={iconButtonClass}
						>
							<Bold size={16} />
						</button>
						<button
							type="button"
							onClick={() => applyFormat("==")}
							aria-label="Highlight text"
							className={iconButtonClass}
						>
							<Highlighter size={16} />
						</button>
					</>
				) : null}
				<button
					type="button"
					onClick={handleSave}
					aria-label="Edit text"
					className={`${iconButtonClass} z-10`}
				>
					{!isEditing ? <Pencil size={16} /> : <Check size={16} />}
				</button>
			</div>
		</>
	);
}
