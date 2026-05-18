"use client";

import { Brain } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	generateWrongOptionsAction,
	reorderQuestionsAction,
} from "@/src/app/actions";
import EditField from "@/src/components/questions/EditField";
import DeleteButton from "@/src/components/ui/DeleteButton";
import type { StudyQuestion } from "@/src/types";
import AddQuestionButton from "./AddQuestionButton";
import ImageUploadButton from "./ImageUploadButton";

interface QuestionListProps {
	questions: StudyQuestion[];
	reviewId: string;
}

function ResizableImage({ src }: { src: string }) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [aspectRatio, setAspectRatio] = useState<number | null>(null);
	const [maxHeight, setMaxHeight] = useState<number>();
	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper || !aspectRatio) return;

		const updateSize = () => {
			setMaxHeight(wrapper.clientWidth / aspectRatio);
		};

		updateSize();

		const observer = new ResizeObserver(updateSize);
		observer.observe(wrapper);

		return () => observer.disconnect();
	}, [aspectRatio]);

	return (
		<div
			ref={wrapperRef}
			className="mt-3 w-[500px] max-w-full resize overflow-auto rounded-md border border-muted-foreground/20"
			style={maxHeight ? { maxHeight } : undefined}
		>
			<Image
				src={src}
				alt="supporting image"
				width={500}
				height={500}
				className="block h-auto w-full rounded-md object-contain"
				onLoad={(e) => {
					const { naturalWidth, naturalHeight } = e.currentTarget;
					if (!naturalWidth || !naturalHeight) return;
					setAspectRatio(naturalWidth / naturalHeight);
				}}
			/>
		</div>
	);
}

export default function QuestionList({
	questions: initialQuestions,
	reviewId,
}: QuestionListProps) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [dragOverId, setDragOverId] = useState<string | null>(null);
	const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
	const [previewQuestions, setPreviewQuestions] = useState(initialQuestions);
	const [optionsAddedAlert, setOptionsAddedAlert] = useState<string[] | null>(
		null,
	);
	const optionsAddedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const isAnyEditing = editingFields.size > 0;

	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	function displayElement(id: string) {
		setIsDeleting(id);
	}
	useEffect(() => {
		setPreviewQuestions(initialQuestions);
	}, [initialQuestions]);

	function handleEditingChange(fieldKey: string, isEditing: boolean) {
		setEditingFields((prev) => {
			if (isEditing) {
				if (prev.has(fieldKey)) return prev;
				const next = new Set(prev);
				next.add(fieldKey);
				return next;
			}

			if (!prev.has(fieldKey)) return prev;
			{
				const next = new Set(prev);
				next.delete(fieldKey);
				return next;
			}
		});
	}

	function handleDragStart(questionId: string) {
		if (isAnyEditing) return;
		setActiveId(questionId);
	}

	function handleDragEnd() {
		setActiveId(null);
		setDragOverId(null);
		setPreviewQuestions(initialQuestions);
	}

	function handleDragOver(e: React.DragEvent, questionId: string) {
		e.preventDefault();
		if (!activeId || activeId === questionId) return;
		setDragOverId(questionId);
		setPreviewQuestions((currentQuestions) => {
			const fromIndex = currentQuestions.findIndex((q) => q.id === activeId);
			const toIndex = currentQuestions.findIndex((q) => q.id === questionId);

			if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
				return currentQuestions;
			}

			const nextQuestions = [...currentQuestions];
			const [movedQuestion] = nextQuestions.splice(fromIndex, 1);

			if (!movedQuestion) return currentQuestions;

			nextQuestions.splice(toIndex, 0, movedQuestion);
			return nextQuestions;
		});
	}

	async function handleDrop() {
		if (!activeId) {
			handleDragEnd();
			return;
		}

		const reorderedQuestions = previewQuestions;
		handleDragEnd();
		try {
			await reorderQuestionsAction(activeId, reorderedQuestions);
		} catch (error) {
			console.error("Failed to reorder questions", error);
		}
	}

	async function handleGenerateWrongOptions(question: StudyQuestion) {
		const generatedOptions = await generateWrongOptionsAction(
			question.question,
			question.answer,
			question.id,
		);

		setOptionsAddedAlert(generatedOptions);
		if (optionsAddedTimeoutRef.current) {
			clearTimeout(optionsAddedTimeoutRef.current);
		}
		optionsAddedTimeoutRef.current = setTimeout(() => {
			setOptionsAddedAlert(null);
			optionsAddedTimeoutRef.current = null;
		}, 3000);
	}

	return (
		<div className="relative space-y-4">
			{previewQuestions.map((q, idx) => {
				const prevDisplayOrder = q.displayOrder ?? null;
				const nextDisplayOrder =
					previewQuestions[idx + 1]?.displayOrder ?? null;

				return (
					<div
						className={`space-y-2 ${isDeleting === q.id ? "hidden" : ""}`}
						key={q.id}
					>
						<article
							draggable={!isAnyEditing}
							onDragStart={() => handleDragStart(q.id)}
							onDragEnd={handleDragEnd}
							onDragOver={(e) => handleDragOver(e, q.id)}
							onDrop={() => void handleDrop()}
							className={`transition-[opacity,transform,box-shadow] duration-150 ${
								activeId === q.id ? "cursor-grabbing opacity-0" : ""
							} ${
								dragOverId === q.id ? "scale-[1.01] shadow-lg" : ""
							} ${isAnyEditing ? "cursor-default" : "cursor-grab"}`}
						>
							<div className="flex items-start gap-4 rounded-lg bg-muted p-6 shadow">
								<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted-hover text-sm font-medium">
									{idx + 1}
								</div>
								<div className="w-1 flex-1">
									<div className="flex items-center gap-2">
										<EditField
											textField={q.question}
											id={q.id}
											onEditingChange={(isEditing) =>
												handleEditingChange(`${q.id}:question_text`, isEditing)
											}
											table="questions"
											col="question_text"
										/>
										<ImageUploadButton id={q.id} />
										<DeleteButton
											id={q.id}
											table="questions"
											name={q.question}
											displayElement={() => displayElement(q.id)}
										/>

										{(q.options?.length ?? 0) === 0 && (
											<button
												type="button"
												onClick={() => void handleGenerateWrongOptions(q)}
												className="bg-transparent rounded-full cursor-pointer hover:text-primary"
											>
												<Brain size={16} />
											</button>
										)}
									</div>
									{q.imageUrl && <ResizableImage src={q.imageUrl} />}
									<details className="mt-4 text-sm">
										<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
											Show answer
										</summary>
										<div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted-hover p-4">
											<EditField
												textField={q.answer}
												id={q.id}
												onEditingChange={(isEditing) =>
													handleEditingChange(`${q.id}:answer_text`, isEditing)
												}
												table="questions"
												col="answer_text"
											/>
										</div>
									</details>
								</div>
							</div>
						</article>
						<AddQuestionButton
							uploadId={reviewId}
							insertAtPosition={q.displayOrder ?? 0}
							prevDisplayOrder={prevDisplayOrder}
							nextDisplayOrder={nextDisplayOrder}
						/>
					</div>
				);
			})}
			{optionsAddedAlert && (
				<span
					aria-live="polite"
					className="absolute right-0 bottom-0 flex max-w-sm flex-col gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow"
				>
					<span>Multiple choice questions added</span>
					{optionsAddedAlert.map((option, index) => (
						<span key={`${index}-${option}`} className="font-normal">
							{index + 1}. {option}
						</span>
					))}
				</span>
			)}
		</div>
	);
}
