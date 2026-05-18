"use client";
import { ChevronDown } from "lucide-react";

export default function QuizCard() {
	return (
		<button
			type="button"
			aria-label="Next question"
			className="mt-12 cursor-pointer"
			onClick={() =>
				window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
			}
		>
			<ChevronDown
				aria-hidden="true"
				className="size-14 duration-500 hover:translate-y-1 hover:scale-110"
			/>
		</button>
	);
}
