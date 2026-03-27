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

export default function FoldersList({ folders, uploads }: FoldersListProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);

  async function handleDrop(folderId: string) {
    if (!activeUploadId) return;

    const upload = uploads.find((item) => item.id === activeUploadId);

    setDropFolderId(null);
    setActiveUploadId(null);

    if (!upload || upload.folder_id === folderId) return;

    try {
      await updateUploadFolderAction(activeUploadId, folderId);
      setOpenFolder(folderId);
    } catch (error) {
      console.error("Failed to move upload", error);
    }
  }

  return (
    <>
      <div className="transition-transform duration-300 space-y-2">
        {folders.map((folder, index) => {
          const FolderIcon = openFolder === folder.id ? FolderOpen : Folder;
          const folderUploads = uploads.filter((upload) => upload.folder_id === folder.id);
          return (
            <div className="" key={folder.id}>
              <li
                onDragOver={(e) => {
                  if (!activeUploadId) return;
                  e.preventDefault();
                  if (dropFolderId !== folder.id) setDropFolderId(folder.id);
                }}
                onDragLeave={() => {
                  if (dropFolderId === folder.id) setDropFolderId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  void handleDrop(folder.id);
                }}
                className={`flex min-h-14 items-center gap-3 rounded-md px-2 text-lg transition-colors ${dropFolderId === folder.id ? "bg-background ring-1 ring-border" : "hover:bg-background"
                  }`}
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
                      draggable
                      isDragging={activeUploadId === upload.id}
                      onDragStart={setActiveUploadId}
                      onDragEnd={() => {
                        setActiveUploadId(null);
                        setDropFolderId(null);
                      }}
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
            draggable
            isDragging={activeUploadId === item.id}
            onDragStart={setActiveUploadId}
            onDragEnd={() => {
              setActiveUploadId(null);
              setDropFolderId(null);
            }}
          />
        ))}
    </>
  );
}
