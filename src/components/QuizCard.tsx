"use client";
import { ChevronDown } from "lucide-react";

export default function QuizCard() {
	return (
		<div className="mt-12">
			<ChevronDown
				onClick={() =>
					window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
				}
				className="cursor-pointer size-14 hover:scale-110 duration-500 hover:translate-y-1"
			/>
		</div>
	);
}
