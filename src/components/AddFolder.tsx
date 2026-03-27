"use client";
import { FolderPlus, Save } from "lucide-react";
import { useRef, useState } from "react";
import { addFolderAction } from "../app/actions";

export default function AddFolder() {
  const [addFolderState, setAddFolderState] = useState(false);
  const [folderName, setFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const openField = () => {
    setAddFolderState(true);
    inputRef.current?.focus();
  };
  const addFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await addFolderAction(folderName);
      setFolderName("");
      setAddFolderState(false);
    } catch (error) {
      console.error("Failed to add folder:", error);
    }
  };

  return (
    <li
      className={`flex min-h-14 items-center justify-between gap-4 rounded-md px-2 hover:bg-background/60`}
    >
      <div
        className={`overflow-hidden transition-all duration-300 ${addFolderState ? "w-full " : "w-0 "}`}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Folder name..."
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFolder()}
          className="h-full w-full rounded border border-border/60 bg-background px-3 py-2 outline-none "
          onBlur={() => setAddFolderState(false)}
        />
      </div>
      <button
        type="button"
        className="cursor-pointer text-foreground/80 transition-all duration-200 hover:scale-110 hover:text-foreground"
        onClick={() => (addFolderState ? addFolder() : openField())}
      >
        <div className={`transition-all duration-300 `}>
          {addFolderState ? <Save size={36} strokeWidth={1.5} /> : <FolderPlus strokeWidth={1.5} size={36} />}
        </div>
      </button>
    </li>
  );
}
