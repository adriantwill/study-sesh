"use client";

type StudyProgressProps = {
  completedCount: number;
  totalCount: number;
  cardsLeft: number;
};

function clampPercentage(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function StudyProgress({
  completedCount,
  totalCount,
  cardsLeft,
}: StudyProgressProps) {
  const safeTotal = Math.max(totalCount, 1);
  const progress = clampPercentage((completedCount / safeTotal) * 100);
  const remainingCount = Math.max(totalCount - completedCount, 0);

  return (
    <div className="w-full px-2 mb-10">
      <div className="mb-2 flex items-center justify-between gap-3 px-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/80 sm:text-[0.7rem]">
        <div className="flex items-baseline gap-1.5">
          <span>Known</span>
          <span className="text-xs font-semibold tracking-normal text-foreground/85 sm:text-sm">
            {completedCount}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span>Left</span>
          <span className="text-xs font-semibold tracking-normal text-foreground/85 sm:text-sm">
            {cardsLeft}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span>Unknown</span>
          <span className="text-xs font-semibold tracking-normal text-foreground/85 sm:text-sm">
            {remainingCount}
          </span>
        </div>
      </div>

      <div className="relative h-9 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white/20 sm:h-10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/70 via-primary to-primary transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
