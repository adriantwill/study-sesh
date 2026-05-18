"use client";

import Link from "next/link";
import { useState } from "react";
import DeleteButton from "@/src/components/ui/DeleteButton";
import type { Database, Tables } from "@/src/types/database.types";

type UploadLinkTable = keyof Pick<
	Database["public"]["Tables"],
	"uploads" | "table_uploads"
>;

interface UploadLinkProps {
	upload: Tables<"uploads"> | Tables<"table_uploads">;
	tree?: boolean;
	draggable?: boolean;
	isDragging?: boolean;
	onDragStart?: (uploadId: string) => void;
	onDragEnd?: () => void;
	variant: UploadLinkTable;
}

export default function UploadLink({
	upload,
	tree = false,
	draggable = false,
	isDragging = false,
	onDragStart,
	onDragEnd,
	variant,
}: UploadLinkProps) {
	const [isDeleting, setIsDeleting] = useState<string | null>(null);

	function displayElement(id: string) {
		setIsDeleting(id);
	}
	return (
		<li
			id={upload.id}
			draggable={draggable}
			onDragStart={() => onDragStart?.(upload.id)}
			onDragEnd={onDragEnd}
			className={`${isDeleting === upload.id ? "hidden" : ""} ${tree ? "py-1 pl-4" : "mt-2"} ${draggable ? "cursor-grab" : ""} ${isDragging ? "opacity-40" : ""}`}
		>
			<div className="flex min-h-12 items-center justify-between rounded-md px-2 py-1 text-lg transition-colors duration-200 hover:bg-muted-hover">
				<Link
					href={`${variant}/${upload.id}`}
					className="overflow-x-hidden text-foreground/85 transition-colors hover:text-foreground"
				>
					{upload.filename}
				</Link>
				<div className="flex items-center gap-3 text-foreground/70">
					<DeleteButton
						id={upload.id}
						table={variant}
						name={upload.filename}
						displayElement={() => displayElement(upload.id)}
					/>
				</div>
			</div>
		</li>
	);
}
