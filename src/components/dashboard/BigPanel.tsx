import type { HTMLAttributes, ReactNode } from "react";
import NewItemButton from "../ui/NewItemButton";

interface BigPanelProps {
	children: ReactNode;
	title: string;
	control?: ReactNode;
	addAction: () => Promise<void>;
	scrollAreaProps?: HTMLAttributes<HTMLDivElement>;
}

export default function BigPanel({
	children,
	title,
	control,
	addAction,
	scrollAreaProps,
}: BigPanelProps) {
	const { className: scrollAreaClassName, ...scrollAreaAttributes } =
		scrollAreaProps ?? {};

	return (
		<div className=" flex min-h-0 w-full flex-1 flex-col rounded-sm bg-muted shadow p-4 ">
			<div className="flex items-center gap-4 pb-4 font-medium text-3xl">
				<div className="min-w-0 basis-2/3">{title}</div>
				{control && <div className="min-w-0 basis-1/3">{control}</div>}
			</div>
			<hr className="border-border" />
			<div
				{...scrollAreaAttributes}
				className={`min-h-0 flex-1 overflow-y-auto ${scrollAreaClassName ?? ""}`}
			>
				<ul className="space-y-2 transition-transform duration-300">
					{children}
				</ul>
			</div>
			<NewItemButton action={addAction} label="New item" />
		</div>
	);
}
