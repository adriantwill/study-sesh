"use client"
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
    <li className={`flex items-center gap-5 translate-y-2 ${addFolderState ? 'justify-between' : 'justify-center'}`}>
      <div className={`overflow-hidden transition-all duration-300 ${addFolderState ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Folder name..."
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFolder()}
          className="px-1 py-0.5  w-full border border-border rounded outline-none "
          onBlur={() => setAddFolderState(false)}
        />
      </div>
      <button
        className="cursor-pointer transition-transform duration-200 hover:scale-110"
        onClick={() => addFolderState ? addFolder() : openField()}
      >
        <div className={`transition-transform duration-300 `}>
          {addFolderState ? (
            <Save size={20} />
          ) : (
            <FolderPlus size={28} />
          )}
        </div>
      </button>
    </li>
  );
}
