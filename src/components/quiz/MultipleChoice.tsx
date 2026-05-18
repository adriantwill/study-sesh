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
			? "choice-border-correct"
			: revealResult && selected && !correct
				? "choice-border-wrong"
				: "";

	return (
		<button
			type="button"
			onClick={checkAnswer}
			className={`choice-border-anim flex w-full items-center justify-between gap-3 rounded border bg-muted px-4 py-3 text-xl whitespace-pre-wrap text-foreground transition ${
				revealResult
					? "cursor-default border-transparent"
					: "cursor-pointer border-border"
			} ${resultClass}`}
		>
			{parseMarkdown(choice)}
		</button>
	);
}
