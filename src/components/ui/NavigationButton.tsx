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
			className="my-36 cursor-pointer rounded-full p-3 font-medium text-muted-foreground transition-[transform,background-color,color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:scale-110 hover:bg-muted/70 hover:text-foreground hover:shadow active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
		>
			<Icon aria-hidden="true" className="size-5" />
		</button>
	);
}
