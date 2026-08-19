"use client";

import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Card } from "ts-fsrs";
import { fsrs, Rating } from "ts-fsrs";
import Flashcard from "@/src/components/study/Flashcard";
import NavigationButton from "@/src/components/ui/NavigationButton";
import { addTelemetry, updateFsrsAction } from "@/src/db/queries";
import type { EventInsert, Question } from "@/src/types";
import StudyProgress from "./StudyProgress";

export default function FlashcardView({
	questions: initialQuestions,
	height,
	mode = "review",
}: {
	questions: Question[];
	height?: string;
	mode?: "review" | "study";
}) {
	const isStudyMode = mode === "study";
	// const [questions, setQuestions] = useState(initialQuestions);
	const [card, setCard] = useState(initialQuestions[0]);
	const _cardId = useRef<string | undefined>(undefined);
	const [direction, setDirection] = useState<"next" | "prev" | "initial">(
		"initial",
	);
	const [isFlipped, setIsFlipped] = useState(false);
	const scheduler = fsrs();
	const valid_ratings = [Rating.Again, Rating.Good] as const;
	//TODO Fix if only 1 study card
	// const [actionHistory, setActionHistory] = useState<
	// 	Array<{
	// 		type: "complete" | "skip";
	// 		id: string;
	// 		prevIndex: number;
	// 	}>
	// >([]);
	//
	// const [completedIds, setCompletedIds] = useState<string[]>(() => {
	// 	if (!isStudyMode) return [];
	// 	return questions.filter((q) => getItem(q.id)).map((q) => q.id);
	// });

	// const initialQuestions = useMemo(() => {
	// 	if (!isStudyMode) return questions;
	// 	return questions.filter((q) => !completedIds.includes(q.id));
	// }, [questions, isStudyMode, completedIds]);
	const [currentIndex, setCurrentIndex] = useState(0);

	async function setDifficulty(
		level: (typeof valid_ratings)[number],
		question: Question,
	) {
		changeDirection(1);
		const card: Card = {
			due: new Date(question.fsrsDueAt),
			stability: question.fsrsStability,
			difficulty: question.fsrsDifficulty,
			scheduled_days: question.fsrsScheduled,
			learning_steps: question.fsrsLearning,
			elapsed_days: Math.round(
				(Date.now() - new Date(question.fsrsLastReviewedAt).getTime()) /
					(60 * 60 * 24 * 1000),
			),
			reps: question.fsrsReviewCount,
			lapses: question.fsrsLapses,
			state: question.fsrsState,
			last_review: new Date(question.fsrsLastReviewedAt),
		};
		const result = scheduler.next(card, new Date(), level);
		await updateFsrsAction(question.id, result.card);
		const telemetry: EventInsert = {
			beforeDifficulty: card.difficulty,
			beforeStability: card.stability,
			createdAt: new Date().toISOString(),
			difficulty: result.card.difficulty,
			eventType: "card_rated",
			questionId: question.id,
			rating: level,
			stability: result.card.stability,
		};
		addTelemetry(telemetry);
		if (new Date(initialQuestions[1].fsrsDueAt) <= new Date()) {
			const telemetry: EventInsert = {
				beforeDifficulty: initialQuestions[1].fsrsDifficulty,
				beforeStability: initialQuestions[1].fsrsStability,
				createdAt: new Date().toISOString(),
				difficulty: initialQuestions[1].fsrsDifficulty,
				eventType: "card_shown",
				questionId: initialQuestions[1].id,
				rating: null,
				stability: initialQuestions[1].fsrsStability,
			};
			addTelemetry(telemetry);
		}
	}

	const changeDirection = (dir: -1 | 1) => {
		setDirection(dir === 1 ? "next" : "prev");
		setIsFlipped(false);
		const temp =
			mode === "review"
				? (((currentIndex + dir) % initialQuestions.length) +
						initialQuestions.length) %
					initialQuestions.length
				: 1;
		setCurrentIndex(temp);
		setCard(initialQuestions[temp]);
	};
	// const handleUndo = () => {
	// 	const lastAction = actionHistory.at(-1);
	// 	if (!lastAction) return;
	//
	// 	if (lastAction.type === "complete") {
	// 		removeItem(lastAction.id);
	// 		setCompletedIds((prev) => {
	// 			const nextCompletedIds = prev.filter((id) => id !== lastAction.id);
	// 			const nextinitialQuestions = questions.filter(
	// 				(q) => !nextCompletedIds.includes(q.id),
	// 			);
	// 			const targetIndex = nextinitialQuestions.findIndex(
	// 				(q) => q.id === lastAction.id,
	// 			);
	// 			setCurrentIndex(targetIndex === -1 ? 0 : targetIndex);
	// 			return nextCompletedIds;
	// 		});
	// 		setActionHistory((prev) => prev.slice(0, -1));
	// 		return;
	// 	}
	//
	// 	const targetIndex = Math.max(
	// 		0,
	// 		Math.min(lastAction.prevIndex, initialQuestions.length - 1),
	// 	);
	// 	setCurrentIndex(targetIndex);
	// 	setActionHistory((prev) => prev.slice(0, -1));
	// };
	//
	// const handleReset = () => {
	// 	for (const id of completedIds) {
	// 		removeItem(id);
	// 	}
	// 	setCompletedIds([]);
	// 	setCurrentIndex(0);
	// 	setActionHistory([]);
	// };
	// function allCards() {
	// 	setFQuestions(initialQuestions);
	// 	setCurrentIndex(0);
	// }

	const animationClass =
		direction === "next"
			? "animate-slide-in-right"
			: direction === "prev"
				? "animate-slide-in-left"
				: "animate-slide-in-right";

	if (isStudyMode && new Date(card.fsrsDueAt) >= new Date()) {
		return (
			<div className="mx-auto max-w-md space-y-4 animate-soft-pop rounded-xl border border-primary/20 bg-muted/80 px-8 py-16 text-center shadow-lg motion-reduce:animate-none">
				<p className="text-2xl font-semibold text-foreground">
					All questions completed for now!
				</p>
				{/* <button */}
				{/* 	type="button" */}
				{/* 	onClick={() => allCards()} */}
				{/* 	className="rounded-full px-4 py-2 text-sm text-muted-foreground underline transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:text-foreground active:scale-95" */}
				{/* > */}
				{/* 	Keep Studying? */}
				{/* </button> */}
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
					if (e.key === "ArrowRight") setDifficulty(Rating.Good, card);
					else setDifficulty(Rating.Again, card);
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
					totalCount={initialQuestions.length}
					cardsLeft={
						initialQuestions.filter((q) => new Date(q.fsrsDueAt) <= new Date())
							.length - (card.id === initialQuestions[0].id ? 0 : 1)
					}
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
					key={`${card.id}-${direction}`}
					type="button"
					className={`group w-full ${height} perspective-distant cursor-pointer rounded-xl transition-transform duration-200 ease-out active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:animate-none motion-reduce:transition-none ${animationClass}`}
					onClick={() => {
						setIsFlipped(!isFlipped);
						const telemetry: EventInsert = {
							beforeDifficulty: card.fsrsDifficulty,
							beforeStability: card.fsrsStability,
							createdAt: new Date().toISOString(),
							difficulty: card.fsrsDifficulty,
							eventType: "card_flipped",
							questionId: card.id,
							rating: null,
							stability: card.fsrsStability,
						};
						addTelemetry(telemetry);
					}}
				>
					<div
						className={`relative h-full w-full transform-3d transition-[transform] duration-500 ease-out motion-reduce:transition-none ${isFlipped ? "-rotate-y-180" : "hover:-rotate-y-6 hover:scale-[1.01]"}`}
					>
						<Flashcard text={card.answerText} isBack />
						<Flashcard
							text={card.questionText}
							imageUrl={card.imageUrl}
							limitImageSize={isStudyMode}
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
						{currentIndex + 1} / {initialQuestions.length}
					</div>
				</div>
			)}
			{isStudyMode && (
				<div>
					<div className="flex justify-center gap-4">
						{valid_ratings.map((index) => {
							const Icon = index === valid_ratings[1] ? Check : X;
							return (
								<button
									key={index}
									type="button"
									disabled={card.id === initialQuestions[1].id}
									onClick={() => setDifficulty(index, card)}
									className={`rounded-full p-4 text-muted-foreground transition-[transform,background-color,color,box-shadow] duration-200 ease-out enabled:hover:-translate-y-1 enabled:hover:scale-110 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary enabled:hover:text-primary enabled:hover:shadow-lg`}
								>
									<Icon size={40} strokeWidth={2.5} />
								</button>
							);
						})}
					</div>
					{/* <div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground"> */}
					{/* 	{completedIds.length > 0 || actionHistory.length > 0 ? ( */}
					{/* 		<button */}
					{/* 			type="button" */}
					{/* 			onClick={actionHistory.length > 0 ? handleUndo : handleReset} */}
					{/* 			className="rounded-full px-3 py-1 underline transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-muted-hover hover:text-foreground active:scale-95" */}
					{/* 		> */}
					{/* 			{actionHistory.length > 0 ? "Undo" : "Reset progress"} */}
					{/* 		</button> */}
					{/* 	) : ( */}
					{/* 		<button */}
					{/* 			type="button" */}
					{/* 			onClick={() => setQuestions(shuffleArray(questions))} */}
					{/* 			className="rounded-full px-3 py-1 underline transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 hover:bg-muted-hover hover:text-foreground active:scale-95" */}
					{/* 		> */}
					{/* 			Shuffle Deck */}
					{/* 		</button> */}
					{/* 	)} */}
					{/* </div> */}
				</div>
			)}
		</div>
	);
}
