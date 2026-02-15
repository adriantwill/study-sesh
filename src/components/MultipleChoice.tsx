import { parseMarkdown } from "../lib/markdown";

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

  const resultClass = revealResult && correct
    ? "choice-border-correct"
    : revealResult && selected && !correct
      ? "choice-border-wrong"
      : "";

  return (
    <button
      type="button"
      onClick={checkAnswer}
      className={`bg-muted w-full overflow-y-visible rounded py-3 whitespace-pre-wrap flex justify-between text-xl text-foreground px-4 items-center border gap-3 transition choice-border-anim ${revealResult ? "border-transparent cursor-default" : "border-border cursor-pointer"
        } ${resultClass}`}
    >
      {parseMarkdown(choice)}
    </button>
  );
}
