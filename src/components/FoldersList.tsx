"use client";
import { Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { Tables } from "../types/database.types";

import UploadLink from "./UploadLink";

interface FoldersListProps {
	folders: Tables<"folders">[];
	uploads: Tables<"uploads">[];
}

export default function FoldersList({ folders, uploads }: FoldersListProps) {
	const [openFolder, setOpenFolder] = useState<string | null>(null);
	const foldersWithUploads =
		folders?.map((folder) => ({
			...folder,
			uploads: uploads?.filter((u) => u.folder_id === folder.id) || [],
		})) || [];
	return (
		<div className="transition-transform duration-300">
			{foldersWithUploads.map((folder) => (
				<div className="" key={folder.id}>
					<li
						className="flex text-base items-end gap-2 cursor-pointer hover:text-muted-foreground transition-colors"
						onClick={() =>
							setOpenFolder(openFolder === folder.id ? null : folder.id)
						}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setOpenFolder(openFolder === folder.id ? null : folder.id);
							}
						}}
					>
						<b>{folder.name}</b>
						{openFolder === folder.id ? (
							<FolderOpen size={19} className="" />
						) : (
							<Folder size={19} className=" hover:scale-110" />
						)}
					</li>

					<div
						className={`grid transition-all duration-200 ${openFolder === folder.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
					>
						<ul className="space-y-1 pl-6 overflow-hidden min-h-0">
							{folder.uploads.map((upload) => (
								<UploadLink
									key={upload.id}
									upload={upload}
									folders={foldersWithUploads}
								/>
							))}
						</ul>
					</div>
				</div>
			))}
		</div>
	);
}
