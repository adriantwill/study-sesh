"use client";
import { Folder, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { Tables } from "../types/database.types";

import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import UploadLink from "./UploadLink";

interface FoldersListProps {
  folders: Tables<"folders">[];
  uploads: Tables<"uploads">[];
}

export default function FoldersList({ folders, uploads }: FoldersListProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  return (
    <div className="transition-transform duration-300 space-y-1">
      {folders.map((folder) => {
        const FolderIcon = openFolder === folder.id ? FolderOpen : Folder;
        return (
          <div className="" key={folder.id}>
            <li
              className="flex text-base items-end gap-2 "
            >
              <button
                type="button"
                onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
                className="cursor-pointer hover:text-muted-foreground transition-colors"
              >
                <FolderIcon size={19} className="hover:scale-110" />
              </button>
              <EditField variant="folder_name" textField={folder.name} id={folder.id} />
              <DeleteButton variant="folder" id={folder.id} />
            </li>

            <div
              className={`grid transition-all duration-200 ${openFolder === folder.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <ul className="space-y-1 pl-6 overflow-hidden min-h-0">
                {uploads.filter((upload) => upload.folder_id === folder.id).map((upload) => (
                  <UploadLink
                    key={upload.id}
                    upload={upload}
                    folders={folders}
                  />
                ))}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  );
}
