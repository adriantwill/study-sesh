import type { ToolView } from "../types";

interface FlashcardsToolButtonProps {
  activeTool: ToolView;
  onChange: (tool: ToolView) => void;
}

const toolOptions: { label: string; value: ToolView }[] = [
  { label: "Flashcards", value: "flashcards" },
  { label: "Tables", value: "tables" },
];

export default function FlashcardsToolButton({
  activeTool,
  onChange,
}: FlashcardsToolButtonProps) {
  return (
    <div className="flex gap-3">
      {toolOptions.map((tool) => (
        <button
          key={tool.value}
          type="button"
          aria-pressed={activeTool === tool.value}
          onClick={() => onChange(tool.value)}
          className="w-full rounded-sm border border-[color-mix(in_srgb,var(--primary)_26%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-5 py-3 text-left text-lg font-semibold text-[var(--foreground)] shadow-sm backdrop-blur transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]"
        >
          {tool.label}
        </button>
      ))}
    </div>
  );
}
