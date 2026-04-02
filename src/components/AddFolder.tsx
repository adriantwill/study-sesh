"use client";

import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { addFolderAction } from "../app/actions";
import type { Tables } from "../types/database.types";

interface AddFolderProps {
  onFolderAdded?: (folder: Tables<"folders">) => void;
  onFolderSaved?: (tempId: string, folder: Tables<"folders">) => void;
  onFolderAddFailed?: (tempId: string) => void;
}

export default function AddFolder({
  onFolderAdded,
  onFolderSaved,
  onFolderAddFailed,
}: AddFolderProps) {
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateFolder() {
    if (isCreating) return;

    const tempId = `temp-folder-${crypto.randomUUID()}`;

    try {
      setIsCreating(true);
      onFolderAdded?.({
        id: tempId,
        name: "Untitled",
        parent_id: null,
        created_at: new Date().toISOString(),
      });
      const folder = await addFolderAction("Untitled");
      onFolderSaved?.(tempId, folder);
    } catch (error) {
      console.error("Failed to add folder:", error);
      onFolderAddFailed?.(tempId);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <button
      onClick={handleCreateFolder}
      disabled={isCreating}
      type="button"
      className="hover:text-secondary cursor-pointer flex min-h-14 items-center gap-3 rounded-md px-2 text-lg transition-colors disabled:cursor-default disabled:opacity-60"
    >
      <div>
        <FolderPlus size={24} strokeWidth={1.5} className="text-foreground/80 transition-colors hover:text-foreground" />
      </div>
      <span className="whitespace-pre-wrap ">New Folder</span>
    </button>
  );
}
