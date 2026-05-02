export default function FlashcardsToolButton() {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        aria-pressed="true"
        className="w-full rounded-sm border border-[color-mix(in_srgb,var(--primary)_26%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-5 py-3 text-left text-lg font-semibold text-[var(--foreground)] shadow-sm backdrop-blur transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]"
      >
        Flashcards
      </button>
      <button
        type="button"
        className="w-full rounded-sm border border-[color-mix(in_srgb,var(--primary)_26%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] px-5 py-3 text-left text-lg font-semibold text-[var(--foreground)] shadow-sm backdrop-blur transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_18%,transparent)]"
      >
        Tables
      </button>
    </div>
  );
}
