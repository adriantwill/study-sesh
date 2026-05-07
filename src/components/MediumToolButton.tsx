interface FlashcardsToolButtonProps {
	options: {
		label: string;
		onClick: () => void;
		active?: boolean;
	}[];
}

export default function FlashcardsToolButton({
	options,
}: FlashcardsToolButtonProps) {
	return (
		<div className="flex gap-3 mb-4">
			{options.map((option) => (
				<button
					key={option.label}
					type="button"
					aria-pressed={option.active}
					onClick={option.onClick}
					className="rounded-sm border border-border bg-muted px-4 py-2 text-lg font-semibold text-foreground transition-colors hover:bg-muted-hover"
				>
					{option.label}
				</button>
			))}
		</div>
	);
}
