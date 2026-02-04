interface NavigationButtonProps {
	direction: "prev" | "next";
	changeDirection: (direction: -1 | 1) => void;
}

export default function NavigationButton({
	direction,
	changeDirection,
}: NavigationButtonProps) {
	return (
		<button
			type="button"
			onClick={() => changeDirection(direction === "prev" ? -1 : 1)}
			className="rounded-full p-3 my-36 hover:text-foreground text-muted-foreground font-medium transition-colors cursor-pointer"
		>
			{direction === "prev" ? "←" : "→"}
		</button>
	);
}
