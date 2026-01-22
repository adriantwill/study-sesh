"use client"
import { FolderPlus, Save } from "lucide-react";
import { useState } from "react";
import { addFolderAction } from "../app/actions";

export default function AddFolder() {
  const [addFolderState, setAddFolderState] = useState(false);
  const [folderName, setFolderName] = useState("");

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
    <div>
      <li className="flex justify-between">
        {addFolderState ? (
          <input
            type="text"
            placeholder="Folder name..."
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFolder()}
            className="px-1  border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        ) : (
          <div className="border border-transparent">
            <em>Add Folder</em>
          </div>
        )}
        <button
          className="cursor-pointer"
          onClick={() => addFolderState ? addFolder() : setAddFolderState(true)}
        >
          {addFolderState ? (
            <Save size={16} strokeWidth={2.5} />
          ) : (
            <FolderPlus strokeWidth={2.5} size={16} />
          )}
        </button>
      </li>
    </div>
  );
}
