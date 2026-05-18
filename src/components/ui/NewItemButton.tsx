"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

type NewItemButtonProps = {
	action: () => Promise<unknown> | unknown;
	label?: string;
	className?: string;
	disabled?: boolean;
};

export default function NewItemButton({
	action,
	label = "New item",
	className = "",
	disabled = false,
}: NewItemButtonProps) {
	const [isPending, setIsPending] = useState(false);
	const isDisabled = disabled || isPending;

	async function handleClick() {
		if (isDisabled) return;

		setIsPending(true);

		try {
			await action();
		} catch (error) {
			console.error("Failed to run new item action:", error);
		} finally {
			setIsPending(false);
		}
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={isDisabled}
			className={`mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-muted-hover px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-background/70 disabled:cursor-default disabled:opacity-60 ${className}`}
		>
			<Plus className="size-4" aria-hidden="true" />
			{label}
		</button>
	);
}
