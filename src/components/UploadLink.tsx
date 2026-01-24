"use client";
import { Folder } from "lucide-react";
import { Tables } from "../types/database.types";
import DeleteButton from "./DeleteButton";
import Link from "next/link";
import { updateUploadFolderAction } from "../app/actions";

interface UploadLinkProps {
  upload: Tables<"uploads">;
  folders: Tables<"folders">[];
}

export default function UploadLink({ upload, folders }: UploadLinkProps) {
  const handleFolderChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    await updateUploadFolderAction(upload.id, value === "" ? null : value);
  };

  return (
    <li className="flex justify-between items-center">
      <Link href={`/${upload.id}`} className="hover:text-muted-foreground">
        {upload.filename}
      </Link>
      <div className="flex gap-2">
        <div className="relative cursor-pointer">
          <Folder size={16} />
          <select
            value={upload.folder_id ?? ""}
            onChange={handleFolderChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          >
            <option value="">No folder</option>
            {folders && folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <DeleteButton id={upload.id} variant="upload" />
      </div>
    </li>
  );
}
