"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useEffect, useState } from "react";

import { reorderQuestionsAction } from "../app/actions";
import type { StudyQuestion } from "../types";
import AddQuestionButton from "./AddQuestionButton";
import Item from "./Item";

interface DNDContextProps {
	questions: StudyQuestion[];
	reviewId: string;
}

function SortableItem({ q, idx }: { q: StudyQuestion; idx: number }) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: q.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0 : 1,
		cursor: isDragging ? "grabbing" : "grab",
	};

	return (
		<li ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<Item q={q} idx={idx} />
		</li>
	);
}

export default function DNDContext({
	questions: initialQuestions,
	reviewId,
}: DNDContextProps) {
	const [questions, setQuestions] = useState(initialQuestions);
	const [activeId, setActiveId] = useState<string | null>(null);

	// Sync local state when server data changes (add/delete)
	useEffect(() => {
		setQuestions(initialQuestions);
	}, [initialQuestions]);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
	);

	const activeQuestion = activeId
		? questions.find((q) => q.id === activeId)
		: null;
	const activeIdx = activeId
		? questions.findIndex((q) => q.id === activeId)
		: -1;

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={questions.map((q) => q.id)}
				strategy={verticalListSortingStrategy}
			>
				<ul>
					{questions.map((q, idx) => (
						<React.Fragment key={q.id}>
							<SortableItem q={q} idx={idx} />
							<AddQuestionButton
								uploadId={reviewId}
								insertAtPosition={(q.displayOrder ?? idx) + 1}
								variant="inline"
							/>
						</React.Fragment>
					))}
				</ul>
			</SortableContext>

			<DragOverlay>
				{activeQuestion ? (
					<div style={{ cursor: "grabbing" }}>
						<Item q={activeQuestion} idx={activeIdx} />
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);

	function handleDragStart(event: DragStartEvent) {
		setActiveId(String(event.active.id));
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		setActiveId(null);

		if (over && active.id !== over.id) {
			const oldIndex = questions.findIndex((q) => q.id === String(active.id));
			const newIndex = questions.findIndex((q) => q.id === String(over.id));
			const newOrder = arrayMove(questions, oldIndex, newIndex);

			// Optimistic update - UI first
			setQuestions(newOrder);

			// Then persist to DB (fire and forget)
			reorderQuestionsAction(newOrder.map((q) => q.id));
		}
	}
}
