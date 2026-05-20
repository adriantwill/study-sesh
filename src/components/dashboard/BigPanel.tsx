import type { ReactNode } from "react";
import NewItemButton from "../ui/NewItemButton";

interface BigPanelProps {
	children: ReactNode;
	title: string;
	control?: ReactNode;
	addAction: () => Promise<void>;
}

export default function BigPanel({
	children,
	title,
	control,
	addAction,
}: BigPanelProps) {
	return (
		<div className=" flex min-h-0 w-full flex-1 flex-col rounded-sm bg-muted  p-4 shadow">
			<div className="flex items-center gap-4 pb-4 font-medium text-3xl">
				<div className="min-w-0 basis-2/3">{title}</div>
				{control && <div className="min-w-0 basis-1/3">{control}</div>}
			</div>
			<hr className="border-border" />
			<div className="min-h-0 flex-1 overflow-y-auto">
				<ul className="space-y-2 transition-transform duration-300">
					{children}
				</ul>
			</div>
			<NewItemButton action={addAction} label="New item" />
		</div>
	);
}
