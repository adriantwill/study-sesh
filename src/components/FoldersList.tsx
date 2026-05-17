"use client";
import * as lucideReact from "lucide-react";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { updateParentAction } from "../app/actions";
import { signOutAction } from "../app/actions/auth";
import type * as types from "../types";
import type { Database, Tables } from "../types/database.types";
import AddFolder from "./AddFolder";
import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import UploadLink from "./UploadLink";

type UploadTable = keyof Pick<
	Database["public"]["Tables"],
	"uploads" | "table_uploads"
>;

interface FoldersListProps {
	folders: Tables<"folders">[];
	uploads: Tables<"uploads">[];
	tables: Tables<"table_uploads">[];
}

const ROOT_DROP_ID = "__root__";

type FolderRow = Tables<"folders"> & {
	parent_id?: string | null;
};

function groupBy<T, K>(items: T[], getKey: (item: T) => K) {
	const groups = new Map<K, T[]>();

	for (const item of items) {
		const key = getKey(item);
		const group = groups.get(key);

		if (group) group.push(item);
		else groups.set(key, [item]);
	}

	return groups;
}

function hasFolderId<T extends { folder_id: string | null }>(
	item: T,
): item is T & { folder_id: string } {
	return item.folder_id !== null;
}

export default function FoldersList({
	folders,
	uploads,
	tables,
}: FoldersListProps) {
	const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set());
	const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
	const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
	const [dropFolderId, setDropFolderId] = useState<string | null>(null);
	const nestedFolders = folders as FolderRow[];
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [activeTool, setActiveTool] = useState<types.ToolView>("flashcards");

	function displayElement(id: string) {
		setIsDeleting(id);
	}
	const foldersByParentId = groupBy(
		nestedFolders,
		(folder) => folder.parent_id ?? null,
	);
	const folderById = new Map(
		nestedFolders.map((folder) => [folder.id, folder]),
	);
	const uploadsByFolderId = groupBy(
		uploads.filter(hasFolderId),
		(upload) => upload.folder_id,
	);
	const tablesByFolderId = groupBy(
		tables.filter(hasFolderId),
		(table) => table.folder_id,
	);
	const rootUploads = uploads.filter((upload) => upload.folder_id === null);
	const rootTables = tables.filter((table) => table.folder_id === null);
	const rootFolders = foldersByParentId.get(null) ?? [];
	const activeToolIndex = activeTool === "flashcards" ? 0 : 1;
	const toolOptions = [
		{
			label: "Flashcards",
			onClick: () => setActiveTool("flashcards"),
			active: activeTool === "flashcards",
		},
		{
			label: "Tables",
			onClick: () => setActiveTool("tables"),
			active: activeTool === "tables",
		},
	];
	const visibleFolderIds = new Set<string>();
	const visibilityMemo = new Map<string, boolean>();

	function folderIsVisible(folderId: string): boolean {
		const cached = visibilityMemo.get(folderId);
		if (cached !== undefined) return cached;

		const childFolders = foldersByParentId.get(folderId) ?? [];
		const hasActiveFiles =
			activeTool === "flashcards"
				? uploadsByFolderId.has(folderId)
				: tablesByFolderId.has(folderId);
		const hasAnyFiles =
			uploadsByFolderId.has(folderId) || tablesByFolderId.has(folderId);
		const hasVisibleChild = childFolders.some((childFolder) =>
			folderIsVisible(childFolder.id),
		);
		const isEmpty = !hasAnyFiles && childFolders.length === 0;
		const isVisible = hasActiveFiles || hasVisibleChild || isEmpty;

		visibilityMemo.set(folderId, isVisible);
		if (isVisible) visibleFolderIds.add(folderId);
		return isVisible;
	}

	for (const folder of nestedFolders) {
		folderIsVisible(folder.id);
	}

	function toggleFolder(folderId: string) {
		setOpenFolderIds((current) => {
			const next = new Set(current);

			if (next.has(folderId)) {
				next.delete(folderId);
			} else {
				next.add(folderId);
			}

			return next;
		});
	}

	function resetDragState() {
		setActiveUploadId(null);
		setActiveFolderId(null);
		setDropFolderId(null);
	}

	function isDescendant(folderId: string, targetFolderId: string) {
		const childFolders = foldersByParentId.get(folderId) ?? [];

		for (const childFolder of childFolders) {
			if (childFolder.id === targetFolderId) return true;
			if (isDescendant(childFolder.id, targetFolderId)) return true;
		}

		return false;
	}

	function canDropTo(parentId: string | null) {
		if (activeUploadId) {
			const upload = uploads.find((item) => item.id === activeUploadId);
			return !!upload && upload.folder_id !== parentId;
		}

		if (activeFolderId) {
			if (parentId === null) {
				return folderById.get(activeFolderId)?.parent_id !== null;
			}

			if (activeFolderId === parentId) return false;
			return !isDescendant(activeFolderId, parentId);
		}

		return false;
	}

	async function moveDraggedItem(parentId: string | null) {
		const uploadId = activeUploadId;
		const draggedFolderId = activeFolderId;

		resetDragState();

		if (uploadId) {
			try {
				await updateParentAction(uploadId, parentId, "uploads", "folder_id");
				if (parentId) {
					setOpenFolderIds((current) => new Set(current).add(parentId));
				}
			} catch (error) {
				console.error("Failed to move upload", error);
			}

			return;
		}

		if (!draggedFolderId) return;

		try {
			await updateParentAction(
				draggedFolderId,
				parentId,
				"folders",
				"parent_id",
			);
			if (parentId) {
				setOpenFolderIds((current) => new Set(current).add(parentId));
			}
		} catch (error) {
			console.error("Failed to move folder", error);
		}
	}

	function handleFolderDragStart(folderId: string) {
		setActiveUploadId(null);
		setDropFolderId(null);
		setActiveFolderId(folderId);
	}

	function handleUploadDragStart(uploadId: string) {
		setActiveFolderId(null);
		setDropFolderId(null);
		setActiveUploadId(uploadId);
	}

	function handleDragOver(
		event: React.DragEvent<HTMLElement>,
		targetId: string | null,
	) {
		event.stopPropagation();
		if (!canDropTo(targetId)) return;
		event.preventDefault();
		const nextDropId = targetId ?? ROOT_DROP_ID;
		if (dropFolderId !== nextDropId) setDropFolderId(nextDropId);
	}

	function handleDragLeave(
		event: React.DragEvent<HTMLElement>,
		targetId: string | null,
	) {
		event.stopPropagation();
		const currentDropId = targetId ?? ROOT_DROP_ID;

		if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
			if (dropFolderId === currentDropId) setDropFolderId(null);
		}
	}

	function handleDrop(
		event: React.DragEvent<HTMLElement>,
		targetId: string | null,
	) {
		event.stopPropagation();
		if (!canDropTo(targetId)) return;
		event.preventDefault();
		void moveDraggedItem(targetId);
	}

	function renderUpload(
		upload: Tables<"uploads"> | Tables<"table_uploads">,
		tree = false,
		variant: UploadTable,
	) {
		return (
			<UploadLink
				key={upload.id}
				upload={upload}
				tree={tree}
				draggable
				isDragging={activeUploadId === upload.id}
				onDragStart={handleUploadDragStart}
				onDragEnd={resetDragState}
				variant={variant}
			/>
		);
	}

	function renderFolder(folder: FolderRow) {
		const isOpen = openFolderIds.has(folder.id);
		const FolderIcon = isOpen ? lucideReact.FolderOpen : lucideReact.Folder;
		const childFolders = foldersByParentId.get(folder.id) ?? [];
		const folderUploads = uploadsByFolderId.get(folder.id) ?? [];
		const folderTables = tablesByFolderId.get(folder.id) ?? [];

		return (
			<div
				className={`${isDeleting === folder.id ? "hidden" : ""}`}
				key={folder.id}
			>
				<li
					draggable
					onDragStart={() => handleFolderDragStart(folder.id)}
					onDragEnd={resetDragState}
					onDragOver={(event) => handleDragOver(event, folder.id)}
					onDragLeave={(event) => handleDragLeave(event, folder.id)}
					onDrop={(event) => handleDrop(event, folder.id)}
					className={`flex min-h-14 items-center gap-3 rounded-md px-2 text-lg transition-colors ${activeFolderId === folder.id ? "opacity-40" : ""} ${dropFolderId === folder.id ? "bg-background ring-1 ring-border" : "hover:bg-muted-hover"} cursor-grab`}
				>
					<FolderIcon size={28} strokeWidth={1.5} className="hover:scale-110" />
					<EditField
						textField={folder.name}
						id={folder.id}
						table="folders"
						col="name"
						openFolder={() => toggleFolder(folder.id)}
					/>
					<DeleteButton
						table="folders"
						id={folder.id}
						name={folder.name}
						displayElement={() => displayElement(folder.id)}
					/>
				</li>

				<div
					className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
				>
					<ul className="ml-3 overflow-hidden">
						{activeTool === "flashcards"
							? folderUploads.map((upload) =>
									renderUpload(upload, true, "uploads"),
								)
							: folderTables.map((table) =>
									renderUpload(table, true, "table_uploads"),
								)}

						{childFolders
							.filter((folder) => visibleFolderIds.has(folder.id))
							.map(renderFolder)}
					</ul>
				</div>
				{!folder.parent_id && <hr className="mt-2 border-border/50" />}
			</div>
		);
	}

	return (
		<div className="flex min-h-0 w-full flex-1 flex-col  rounded-sm bg-muted px-4 py-4 shadow">
			<div className="mb-4 flex justify-between items-center px-2 font-medium text-3xl">
				Andrea's Files
				<div className="relative w-56 grid grid-cols-2 overflow-hidden  border border-muted">
					<span
						aria-hidden="true"
						className="pointer-events-none font-normal absolute inset-y-0 left-0 w-1/2 rounded-sm bg-muted-hover transition-transform duration-300 ease-out"
						style={{ transform: `translateX(${activeToolIndex * 100}%)` }}
					/>
					{toolOptions.map((option) => (
						<button
							key={option.label}
							type="button"
							aria-pressed={option.active}
							onClick={option.onClick}
							className={`text-lg relative z-10 w-full cursor-pointer  py-2 transition-colors duration-200 ${
								option.active ? "text-foreground" : "text-foreground/70"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>
			<hr className="border-border" />

			<div className="overflow-y-auto">
				<ul className="space-y-2 transition-transform duration-300">
					{rootFolders
						.filter((folder) => visibleFolderIds.has(folder.id))
						.map(renderFolder)}
				</ul>
				<AddFolder />
				{(activeTool === "flashcards"
					? rootUploads.length > 0
					: rootTables.length > 0) && (
					<ul
						onDragOver={(event) => handleDragOver(event, null)}
						onDragLeave={(event) => handleDragLeave(event, null)}
						onDrop={(event) => handleDrop(event, null)}
						className={`min-h-14 flex-1 rounded-md transition-colors ${dropFolderId === ROOT_DROP_ID ? "bg-background/60 ring-1 ring-border" : ""} `}
					>
						{activeTool === "flashcards"
							? rootUploads.map((upload) =>
									renderUpload(upload, false, "uploads"),
								)
							: rootTables.map((table) =>
									renderUpload(table, false, "table_uploads"),
								)}
					</ul>
				)}
				<button
					onClick={() => signOutAction()}
					className="absolute cursor-pointer bottom-8 right-8"
					type="button"
				>
					<LogOut size={30} />
				</button>
			</div>
		</div>
	);
}
