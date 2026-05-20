"use client";

import { Check, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Flashcard from "@/src/components/study/Flashcard";
import NavigationButton from "@/src/components/ui/NavigationButton";
import type { StudyQuestion } from "@/src/types";
import { shuffleArray } from "@/src/utils/cards";
import { getItem, removeItem, setItem } from "@/src/utils/localStorage";
import StudyProgress from "./StudyProgress";

export default function FlashcardView({
	questions: initialQuestions,
	height,
	mode = "review",
}: {
	questions: StudyQuestion[];
	height?: string;
	mode?: "review" | "study";
}) {
	const isStudyMode = mode === "study";
	const [questions, setQuestions] = useState(initialQuestions);
	useEffect(() => {
		setQuestions(initialQuestions);
	}, [initialQuestions]);
	const [actionHistory, setActionHistory] = useState<
		Array<{
			type: "complete" | "skip";
			id: string;
			prevIndex: number;
		}>
	>([]);

	const [completedIds, setCompletedIds] = useState<string[]>(() => {
		if (!isStudyMode) return [];
		return questions.filter((q) => getItem(q.id)).map((q) => q.id);
	});

	const filteredQuestions = useMemo(() => {
		if (!isStudyMode) return questions;
		return questions.filter((q) => !completedIds.includes(q.id));
	}, [questions, isStudyMode, completedIds]);

	const [currentIndex, setCurrentIndex] = useState(0);
	const [direction, setDirection] = useState<"next" | "prev" | "initial">(
		"initial",
	);
	const [isFlipped, setIsFlipped] = useState(false);

	const changeDirection = (dir: -1 | 1) => {
		setDirection(dir === 1 ? "next" : "prev");
		setIsFlipped(false);
		setCurrentIndex(
			(prev) =>
				(prev + dir + filteredQuestions.length) % filteredQuestions.length,
		);
	};

	const handleComplete = () => {
		const id = filteredQuestions[currentIndex].id;
		setActionHistory((prev) => [
			...prev,
			{ type: "complete", id, prevIndex: currentIndex },
		]);
		setItem(id, true);
		setIsFlipped(false);
		setCompletedIds((prev) => [...prev, id]);
		if (currentIndex >= filteredQuestions.length - 1) {
			setCurrentIndex(0);
		}
	};

	const handleSkip = () => {
		const id = filteredQuestions[currentIndex].id;
		setActionHistory((prev) => [
			...prev,
			{ type: "skip", id, prevIndex: currentIndex },
		]);
		changeDirection(1);
	};

	const handleUndo = () => {
		const lastAction = actionHistory.at(-1);
		if (!lastAction) return;

		if (lastAction.type === "complete") {
			removeItem(lastAction.id);
			setCompletedIds((prev) => {
				const nextCompletedIds = prev.filter((id) => id !== lastAction.id);
				const nextFilteredQuestions = questions.filter(
					(q) => !nextCompletedIds.includes(q.id),
				);
				const targetIndex = nextFilteredQuestions.findIndex(
					(q) => q.id === lastAction.id,
				);
				setCurrentIndex(targetIndex === -1 ? 0 : targetIndex);
				return nextCompletedIds;
			});
			setActionHistory((prev) => prev.slice(0, -1));
			return;
		}

		const targetIndex = Math.max(
			0,
			Math.min(lastAction.prevIndex, filteredQuestions.length - 1),
		);
		setCurrentIndex(targetIndex);
		setActionHistory((prev) => prev.slice(0, -1));
	};

	const handleReset = () => {
		for (const id of completedIds) {
			removeItem(id);
		}
		setCompletedIds([]);
		setCurrentIndex(0);
		setActionHistory([]);
	};

	const animationClass =
		direction === "next"
			? "animate-slide-in-right"
			: direction === "prev"
				? "animate-slide-in-left"
				: "animate-slide-in-right";

	if (filteredQuestions.length === 0) {
		return (
			<div className="mx-auto max-w-md animate-soft-pop rounded-xl border border-primary/20 bg-muted/80 px-8 py-16 text-center shadow-lg motion-reduce:animate-none">
				<p className="mb-4 text-2xl font-semibold text-foreground">
					All questions completed!
				</p>
				<button
					type="button"
					onClick={handleReset}
					className="rounded-full px-4 py-2 text-sm text-muted-foreground underline transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-muted-hover hover:text-foreground active:scale-95"
				>
					Reset progress
				</button>
			</div>
		);
	}

	return (
		<div
			className="mx-auto space-y-20 focus:outline-none focus-visible:outline-none"
			role="listbox"
			tabIndex={0}
			onKeyDown={(e) => {
				const focusTarget = e.currentTarget;

				if (e.key === "ArrowUp" || e.key === "ArrowDown") {
					e.preventDefault();
					setIsFlipped(!isFlipped);
					return;
				}
				if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

				e.preventDefault();
				if (isStudyMode) {
					if (e.key === "ArrowRight") handleSkip();
					else handleComplete();
				} else {
					changeDirection(e.key === "ArrowRight" ? 1 : -1);
				}
				requestAnimationFrame(() => {
					focusTarget.focus();
				});
			}}
		>
			{isStudyMode && (
				<StudyProgress
					completedCount={completedIds.length}
					totalCount={questions.length}
					cardsLeft={filteredQuestions.length - currentIndex}
				/>
			)}
			<div className="flex gap-4">
				{!isStudyMode && (
					<NavigationButton
						direction="prev"
						changeDirection={changeDirection}
					/>
				)}
				<button
					key={`${filteredQuestions[currentIndex].id}-${direction}`}
					type="button"
					className={`group w-full ${height} perspective-distant cursor-pointer rounded-xl transition-transform duration-200 ease-out active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:animate-none motion-reduce:transition-none ${animationClass}`}
					onClick={() => {
						setIsFlipped(!isFlipped);
					}}
				>
					<div
						className={`relative h-full w-full transform-3d transition-[transform] duration-500 ease-out motion-reduce:transition-none ${isFlipped ? "-rotate-y-180" : "hover:-rotate-y-6 hover:scale-[1.01]"}`}
					>
						<Flashcard text={filteredQuestions[currentIndex].answer} isBack />
						<Flashcard
							text={filteredQuestions[currentIndex].question}
							imageUrl={filteredQuestions[currentIndex].imageUrl}
						/>
					</div>
				</button>
				{!isStudyMode && (
					<NavigationButton
						direction="next"
						changeDirection={changeDirection}
					/>
				)}
			</div>
			{!isStudyMode && (
				<div className="mt-4 flex flex-col items-center">
					<div className="text-sm font-medium text-muted-foreground">
						{currentIndex + 1} / {filteredQuestions.length}
					</div>
				</div>
			)}
			{isStudyMode && (
				<div>
					<div className="flex justify-center gap-4">
						{[0, 1].map((index) => {
							const Icon = index === 0 ? Check : X;
							return (
								<button
									key={index}
									type="button"
									onClick={index === 0 ? handleComplete : handleSkip}
									className={`rounded-full p-4 text-muted-foreground transition-[transform,background-color,color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:scale-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${
										index === 0
											? "hover:bg-primary/10 hover:text-primary hover:shadow-lg"
											: "hover:bg-muted hover:text-foreground hover:shadow-md"
									}`}
								>
									<Icon size={40} strokeWidth={2.5} />
								</button>
							);
						})}
					</div>
					<div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
						{completedIds.length > 0 || actionHistory.length > 0 ? (
							<button
								type="button"
								onClick={actionHistory.length > 0 ? handleUndo : handleReset}
								className="rounded-full px-3 py-1 underline transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-muted-hover hover:text-foreground active:scale-95"
							>
								{actionHistory.length > 0 ? "Undo" : "Reset progress"}
							</button>
						) : (
							<button
								type="button"
								onClick={() => setQuestions(shuffleArray(questions))}
								className="rounded-full px-3 py-1 underline transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-muted-hover hover:text-foreground active:scale-95"
							>
								Shuffle Deck
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
