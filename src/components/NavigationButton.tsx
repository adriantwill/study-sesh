import { ArrowLeft, ArrowRight } from "lucide-react";

interface NavigationButtonProps {
	direction: "prev" | "next";
	changeDirection: (direction: -1 | 1) => void;
}

export default function NavigationButton({
	direction,
	changeDirection,
}: NavigationButtonProps) {
	const Icon = direction === "prev" ? ArrowLeft : ArrowRight;

	return (
		<button
			type="button"
			onClick={() => changeDirection(direction === "prev" ? -1 : 1)}
			aria-label={direction === "prev" ? "Previous card" : "Next card"}
			className="my-36 cursor-pointer rounded-full p-3 font-medium text-muted-foreground transition-colors hover:text-foreground"
		>
			<Icon aria-hidden="true" className="size-5" />
		</button>
	);
}
