import { parseMarkdown } from "@/src/lib/markdown";

interface MultipleChoiceProps {
	choice: string;
	correct: boolean;
	selected: boolean;
	revealResult: boolean;
	onSelect: () => void;
}

export default function MultipleChoice({
	choice,
	correct,
	selected,
	revealResult,
	onSelect,
}: MultipleChoiceProps) {
	function checkAnswer() {
		if (revealResult) return;
		onSelect();
		console.log(correct ? "Correct!" : "Incorrect!");
	}

	const resultClass =
		revealResult && correct
			? "choice-border-correct animate-answer-pop bg-primary/10 ring-1 ring-primary/20 shadow-md"
			: revealResult && selected && !correct
				? "choice-border-wrong animate-answer-shake bg-foreground/5 ring-1 ring-foreground/15"
				: revealResult
					? "opacity-70"
					: "";

	return (
		<button
			type="button"
			onClick={checkAnswer}
			className={`choice-border-anim flex w-full items-center justify-between gap-3 rounded border bg-muted px-4 py-3 text-left text-xl whitespace-pre-wrap text-foreground transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-out motion-reduce:animate-none motion-reduce:transition-none ${
				revealResult
					? "cursor-default border-transparent"
					: "cursor-pointer border-border hover:-translate-y-0.5 hover:bg-muted-hover hover:shadow-md active:scale-[0.99]"
			} ${selected ? "scale-[1.01]" : ""} ${resultClass}`}
		>
			{parseMarkdown(choice)}
		</button>
	);
}
