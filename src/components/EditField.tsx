"use client";
import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import { updateQuestionTextAction } from "../app/actions";
import { parseMarkdown } from "../lib/markdown";

interface EditFieldProps {
	variant: "question_text" | "answer_text";
	textField: string;
	id: string;
}

export default function EditField({ variant, textField, id }: EditFieldProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(textField);
	const updateQuestion = updateQuestionTextAction.bind(null, id, text, variant);

	function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const value = e.target.value;
		const cursorPos = e.target.selectionStart;

		if (value.endsWith("- ")) {
			const newValue = `${value.slice(0, -2)}• `;
			setText(newValue);
			setTimeout(() => {
				e.target.selectionStart = e.target.selectionEnd = cursorPos;
			}, 0);
			return;
		}
		setText(value);
	}

	return (
		<>
			{isEditing ? (
				<textarea
					value={text}
					onChange={handleTextChange}
					rows={Math.max(1, text.split("\n").length)}
					className={`w-full h-full font-medium text-foreground bg-muted-hover rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:border-ring`}
				/>
			) : (
				<span className={`w-full whitespace-pre-wrap }`}>
					{parseMarkdown(text)}
				</span>
			)}
			<button
				type="button"
				onClick={() => {
					if (text !== textField) {
						updateQuestion();
					}
					setIsEditing(!isEditing);
				}}
				aria-label={`Edit text`}
				className="flex items-center justify-center enabled:cursor-pointer enabled:hover:text-secondary "
			>
				{!isEditing ? <Pencil size={16} /> : <Check size={16} />}
			</button>
		</>
	);
}
