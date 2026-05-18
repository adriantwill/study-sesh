interface MediumToolButtonProps {
	options: {
		label: string;
		onClick: () => void;
		active?: boolean;
	};
}

export default function MediumToolButton({ options }: MediumToolButtonProps) {
	return (
		<button
			key={options.label}
			type="button"
			aria-pressed={options.active}
			onClick={options.onClick}
			className="rounded-sm border border-border bg-muted px-4 py-2 text-lg font-semibold text-foreground transition-colors hover:bg-muted-hover"
		>
			{options.label}
		</button>
	);
}
