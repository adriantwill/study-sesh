type SegmentedControlOption<T extends string> = {
	label: string;
	value: T;
};

interface SegmentedControlProps<T extends string> {
	options: readonly SegmentedControlOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel?: string;
}

export default function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
}: SegmentedControlProps<T>) {
	const optionCount = Math.max(options.length, 1);
	const activeIndex = Math.max(
		options.findIndex((option) => option.value === value),
		0,
	);

	return (
		<div
			className="relative grid w-full overflow-hidden border border-muted"
			style={{
				gridTemplateColumns: `repeat(${optionCount}, minmax(0, 1fr))`,
			}}
		>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute inset-y-0 left-0 rounded-sm bg-muted-hover font-normal transition-transform duration-300 ease-out"
				style={{
					width: `${100 / optionCount}%`,
					transform: `translateX(${activeIndex * 100}%)`,
				}}
			/>
			{options.map((option) => {
				const active = option.value === value;

				return (
					<button
						key={option.value}
						type="button"
						aria-pressed={active}
						onClick={() => onChange(option.value)}
						className={`relative z-10 w-full cursor-pointer py-2 text-lg transition-colors duration-200 ${
							active ? "text-foreground" : "text-foreground/70"
						}`}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
