"use client";

import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { addFolderAction } from "@/src/app/actions";

export default function AddFolder() {
	const [isCreating, setIsCreating] = useState(false);

	async function handleCreateFolder() {
		if (isCreating) return;

		try {
			setIsCreating(true);
			await addFolderAction();
		} catch (error) {
			console.error("Failed to add folder:", error);
		} finally {
			setIsCreating(false);
		}
	}

	return (
		<button
			onClick={handleCreateFolder}
			disabled={isCreating}
			type="button"
			className="flex pt-4 cursor-pointer items-center gap-3 rounded-md text-xl transition-colors hover:text-primary disabled:cursor-default disabled:opacity-60"
		>
			<FolderPlus size={24} strokeWidth={1.5} />
			<span>New Folder</span>
		</button>
	);
}
