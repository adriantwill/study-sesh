"use client";
import { Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import { updateUploadFolderAction } from "../app/actions";
import type { Tables } from "../types/database.types";

import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import UploadLink from "./UploadLink";

interface FoldersListProps {
  folders: Tables<"folders">[];
  uploads: Tables<"uploads">[];
}

type FolderRow = Tables<"folders"> & {
  parent_id?: string | null;
};

export default function FoldersList({ folders, uploads }: FoldersListProps) {
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set());
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  const nestedFolders = folders as FolderRow[];
  const foldersByParentId = new Map<string | null, FolderRow[]>();
  const uploadsByFolderId = new Map<string, Tables<"uploads">[]>();
  const rootUploads: Tables<"uploads">[] = [];

  for (const folder of nestedFolders) {
    const parentId = folder.parent_id ?? null;
    const siblings = foldersByParentId.get(parentId);

    if (siblings) siblings.push(folder);
    else foldersByParentId.set(parentId, [folder]);
  }

  for (const upload of uploads) {
    if (upload.folder_id === null) {
      rootUploads.push(upload);
      continue;
    }

    const siblings = uploadsByFolderId.get(upload.folder_id);
    if (siblings) siblings.push(upload);
    else uploadsByFolderId.set(upload.folder_id, [upload]);
  }

  const rootFolders = foldersByParentId.get(null) ?? [];

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
    setDropFolderId(null);
  }

  async function handleDrop(folderId: string) {
    if (!activeUploadId) return;

    const upload = uploads.find((item) => item.id === activeUploadId);

    resetDragState();

    if (!upload || upload.folder_id === folderId) return;

    try {
      await updateUploadFolderAction(activeUploadId, folderId);
      setOpenFolderIds((current) => new Set(current).add(folderId));
    } catch (error) {
      console.error("Failed to move upload", error);
    }
  }

  function handleDragOverFolder(event: React.DragEvent<HTMLLIElement>, folderId: string) {
    if (!activeUploadId) return;
    event.preventDefault();
    if (dropFolderId !== folderId) setDropFolderId(folderId);
  }

  function handleDragLeaveFolder(folderId: string) {
    if (dropFolderId === folderId) setDropFolderId(null);
  }

  function renderFolder(folder: FolderRow) {
    const isOpen = openFolderIds.has(folder.id);
    const FolderIcon = isOpen ? FolderOpen : Folder;
    const childFolders = foldersByParentId.get(folder.id) ?? [];
    const folderUploads = uploadsByFolderId.get(folder.id) ?? [];

    return (
      <div key={folder.id}>
        <li
          onDragOver={(event) => handleDragOverFolder(event, folder.id)}
          onDragLeave={() => handleDragLeaveFolder(folder.id)}
          onDrop={(event) => {
            event.preventDefault();
            void handleDrop(folder.id);
          }}
          className={`flex min-h-14 items-center gap-3 rounded-md px-2 text-lg transition-colors ${dropFolderId === folder.id ? "bg-background ring-1 ring-border" : "hover:bg-background"}`}
        >
          <button
            type="button"
            onClick={() => toggleFolder(folder.id)}
            className="cursor-pointer text-foreground/80 transition-colors hover:text-foreground"
          >
            <FolderIcon size={24} strokeWidth={1.5} className="hover:scale-110" />
          </button>
          <EditField variant="folder_name" textField={folder.name} id={folder.id} />
          <DeleteButton variant="folder" id={folder.id} name={folder.name} />
        </li>

        <div
          className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <ul className="ml-3 overflow-hidden">
            {folderUploads.map((upload) => (
              <UploadLink
                key={upload.id}
                upload={upload}
                tree
                draggable
                isDragging={activeUploadId === upload.id}
                onDragStart={setActiveUploadId}
                onDragEnd={resetDragState}
              />
            ))}

            {childFolders.map(renderFolder)}
          </ul>
        </div>
        {!folder.parent_id && <hr className="mt-2 border-border/50" />}
      </div>
    );
  }

  return (
    <>
      <div className="transition-transform duration-300 space-y-2">
        {rootFolders.map(renderFolder)}
      </div>
      {rootUploads.map((item) => (
        <UploadLink
          key={item.id}
          upload={item}
          draggable
          isDragging={activeUploadId === item.id}
          onDragStart={setActiveUploadId}
          onDragEnd={resetDragState}
        />
      ))}
    </>
  );
}
