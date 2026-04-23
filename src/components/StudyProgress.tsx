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
		<div className="w-full px-2">
			<div className="relative h-9 overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-r from-background/70 via-muted/80 to-background/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_20px_45px_-28px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:h-10">
				<div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.16),transparent_28%,transparent_72%,rgba(255,255,255,0.08))]" />
				<div
					className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary shadow-[0_0_28px_rgba(59,130,246,0.42)] transition-[width] duration-700 ease-out"
					style={{ width: `${progress}%` }}
				>
					<div className="absolute inset-y-0 right-0 w-28 -translate-x-1 animate-pulse rounded-full bg-white/35 blur-md" />
				</div>
			</div>

			<div className="mt-2 flex items-center justify-between gap-3 px-1 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground/80 sm:text-[0.7rem]">
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
		</div>
	);
}
