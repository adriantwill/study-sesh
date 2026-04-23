"use client";
import * as lucideReact from "lucide-react";
import { useState } from "react";
import {
  updateParentAction,
} from "../app/actions";
import type { Tables } from "../types/database.types";
import AddFolder from "./AddFolder";
import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import UploadLink from "./UploadLink";

interface FoldersListProps {
  folders: Tables<"folders">[];
  uploads: Tables<"uploads">[];
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

export default function FoldersList({ folders, uploads }: FoldersListProps) {
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set());
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  const nestedFolders = folders as FolderRow[];
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  function displayElement(id: string) {
    setIsDeleting(id);
  }
  const foldersByParentId = groupBy(
    nestedFolders,
    (folder) => folder.parent_id ?? null,
  );
  const folderById = new Map(nestedFolders.map((folder) => [folder.id, folder]));
  const uploadsByFolderId = groupBy(
    uploads.filter((upload) => upload.folder_id !== null),
    (upload) => upload.folder_id!,
  );
  const rootUploads = uploads.filter((upload) => upload.folder_id === null);
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
        await updateParentAction(uploadId, parentId, "upload");
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
      await updateParentAction(draggedFolderId, parentId, "folder");
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

  function handleDragOver(event: React.DragEvent<HTMLElement>, targetId: string | null) {
    if (!canDropTo(targetId)) return;
    event.preventDefault();
    const nextDropId = targetId ?? ROOT_DROP_ID;
    if (dropFolderId !== nextDropId) setDropFolderId(nextDropId);
  }

  function handleDragLeave(event: React.DragEvent<HTMLElement>, targetId: string | null) {
    const currentDropId = targetId ?? ROOT_DROP_ID;

    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      if (dropFolderId === currentDropId) setDropFolderId(null);
    }
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, targetId: string | null) {
    if (!canDropTo(targetId)) return;
    event.preventDefault();
    void moveDraggedItem(targetId);
  }

  function renderUpload(upload: Tables<"uploads">, tree = false) {
    return (
      <UploadLink
        key={upload.id}
        upload={upload}
        tree={tree}
        draggable
        isDragging={activeUploadId === upload.id}
        onDragStart={handleUploadDragStart}
        onDragEnd={resetDragState}
      />
    );
  }

  function renderFolder(folder: FolderRow) {
    const isOpen = openFolderIds.has(folder.id);
    const FolderIcon = isOpen ? lucideReact.FolderOpen : lucideReact.Folder;
    const childFolders = foldersByParentId.get(folder.id) ?? [];
    const folderUploads = uploadsByFolderId.get(folder.id) ?? [];

    return (
      <div className={`${isDeleting === folder.id ? "hidden" : ""}`} key={folder.id}>
        <li
          draggable
          onDragStart={() => handleFolderDragStart(folder.id)}
          onDragEnd={resetDragState}
          onDragOver={(event) => handleDragOver(event, folder.id)}
          onDragLeave={(event) => handleDragLeave(event, folder.id)}
          onDrop={(event) => handleDrop(event, folder.id)}
          className={`flex min-h-14 items-center gap-3 rounded-md px-2 text-lg transition-colors ${activeFolderId === folder.id ? "opacity-40" : ""} ${dropFolderId === folder.id ? "bg-background ring-1 ring-border" : "hover:bg-muted-hover"} cursor-grab`}
        >
          <button
            type="button"
            onClick={() => toggleFolder(folder.id)}
            className="cursor-pointer text-foreground/80 transition-colors hover:text-foreground"
          >
            <FolderIcon size={24} strokeWidth={1.5} className="hover:scale-110" />
          </button>
          <EditField
            variant="folder_name"
            textField={folder.name}
            id={folder.id}
          />
          <DeleteButton
            variant="folder"
            id={folder.id}
            name={folder.name}
            displayElement={() => displayElement(folder.id)}
          />
        </li>

        <div
          className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <ul className="ml-3 overflow-hidden">
            {folderUploads.map((upload) => renderUpload(upload, true))}

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
      <AddFolder />
      <ul
        onDragOver={(event) => handleDragOver(event, null)}
        onDragLeave={(event) => handleDragLeave(event, null)}
        onDrop={(event) => handleDrop(event, null)}
        className={`flex-1 min-h-14 rounded-md transition-colors ${dropFolderId === ROOT_DROP_ID ? "bg-background/60 ring-1 ring-border" : ""}`}
      >
        {rootUploads.map((upload) =>
          renderUpload(upload),
        )}
      </ul>
    </>
  );
}
