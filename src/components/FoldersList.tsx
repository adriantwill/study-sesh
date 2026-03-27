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
    <>
      <div className="transition-transform duration-300 space-y-2">
        {folders.map((folder) => {
          const FolderIcon = openFolder === folder.id ? FolderOpen : Folder;
          const folderUploads = uploads.filter((upload) => upload.folder_id === folder.id);
          return (
            <div className="" key={folder.id}>
              <li
                className="flex min-h-14 items-center gap-3 rounded-md px-2 text-lg hover:bg-background/60"
              >
                <button
                  type="button"
                  onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
                  className="cursor-pointer text-foreground/80 transition-colors hover:text-foreground"
                >
                  <FolderIcon size={24} strokeWidth={1.5} className="hover:scale-110" />
                </button>
                <EditField variant="folder_name" textField={folder.name} id={folder.id} />
                <DeleteButton variant="folder" id={folder.id} name={folder.name} />
              </li>

              <div
                className={`grid transition-all duration-200 ${openFolder === folder.id ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <ul className="ml-3 border-l border-border/50 overflow-hidden">
                  {folderUploads.map((upload) => (
                    <UploadLink
                      key={upload.id}
                      upload={upload}
                      folders={folders}
                      tree
                    />
                  ))}
                </ul>
              </div>
              <hr className="mt-2 border-border/50" />
            </div>
          )
        })}
      </div>
      {uploads
        .filter((item) => item.folder_id === null)
        .map((item) => (
          <UploadLink
            key={item.id}
            upload={item}
            folders={folders ?? []}
          />
        ))}
    </>
  );
}
