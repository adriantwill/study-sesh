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
      await addFolderAction("Untitled");
    } catch (error) {
      console.error("Failed to add folder:", error);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      {isCreating && (
        <li
          className="animate-in fade-in slide-in-from-top-1 duration-200 flex min-h-14 items-center gap-3 rounded-md px-2 text-lg"
        >
          <div className="h-6 w-6 animate-pulse rounded bg-border/60" />
          <div className="h-6 w-32 animate-pulse rounded bg-border/60" />
        </li>
      )}
      <button
        onClick={handleCreateFolder}
        disabled={isCreating}
        type="button"
        className="hover:text-secondary cursor-pointer flex min-h-14 items-center gap-3 rounded-md px-2 text-lg transition-colors disabled:cursor-default disabled:opacity-60"
      >
        <div>
          <FolderPlus size={24} strokeWidth={1.5} className="text-foreground/80 transition-colors hover:text-foreground" />
        </div>
        <span className="w-full whitespace-pre-wrap ">New Folder</span>
      </button>
    </>
  );
}
