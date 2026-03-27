"use client";

import { FolderPlus } from "lucide-react";
import { useState } from "react";
import { addFolderAction } from "../app/actions";

export default function AddFolder() {
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreateFolder() {
    if (isCreating) return;

    try {
      setIsCreating(true);
      await addFolderAction("New Folder");
    } catch (error) {
      console.error("Failed to add folder:", error);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleCreateFolder}
        disabled={isCreating}
        className="flex min-h-12 w-full items-center gap-2 rounded-md px-1.5 text-base text-foreground/75 transition-colors hover:bg-background/80 hover:text-foreground disabled:cursor-default disabled:opacity-60"
      >
        <FolderPlus size={22} strokeWidth={1.5} />
        <span>New Folder</span>
      </button>
    </li>
  );
}
