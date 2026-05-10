"use client";

import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
	return (
		<button
			type="button"
			aria-label="Scroll to top"
			onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
			className="fixed bottom-6 right-6 z-20 rounded-full border border-border bg-muted p-3 text-foreground shadow-sm transition-colors hover:bg-muted-hover"
		>
			<ArrowUp aria-hidden="true" className="size-5" />
		</button>
	);
}
