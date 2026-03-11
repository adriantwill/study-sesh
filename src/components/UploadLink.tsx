"use client";
import { Folder } from "lucide-react";
import Link from "next/link";
import { updateUploadFolderAction } from "../app/actions";
import type { Tables } from "../types/database.types";
import DeleteButton from "./DeleteButton";

interface UploadLinkProps {
  upload: Tables<"uploads">;
  folders: Tables<"folders">[];
  tree?: boolean;
}

export default function UploadLink({
  upload,
  folders,
  tree = false,
}: UploadLinkProps) {
  const handleFolderChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    await updateUploadFolderAction(upload.id, value === "" ? null : value);
  };

  return (
    <li className={` ${tree ? "relative py-1 pl-4" : "mt-6 text-xl"}`}>
      {tree && <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-border" />}
      <div className=" flex justify-between items-center">
        <Link href={`/${upload.id}`} className=" overflow-x-hidden hover:text-muted-foreground">
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
              {folders?.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <DeleteButton id={upload.id} variant="upload" name={upload.filename} />
        </div>
      </div>
    </li>
  );
}
