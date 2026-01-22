"use client"
import { useState } from "react";
import { Tables } from "../types/database.types";
import { Folder } from "lucide-react";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import EditField from "./EditField";
import DeleteButton from "./DeleteButton";

type FolderWithUploads = Tables<"folders"> & {
  uploads: Tables<"uploads">[];
};

interface FoldersListProps {
  foldersWithUploads: FolderWithUploads[];
}

export default function FoldersList({ foldersWithUploads }: FoldersListProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  return (
    <div>
      {foldersWithUploads.map((folder) => (
        <div key={folder.id}>
          <li
            className="flex text-base items-end gap-2 cursor-pointer"
            onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
          >
            <b>{folder.name}</b>
            <Folder size={19} className="" />
          </li>

          {openFolder === folder.id && (
            <ul className="space-y-1 pl-6">
              {folder.uploads.map((upload) => (
                <li
                  key={upload.id}
                  className="flex justify-between items-center"
                >
                  <EditField
                    variant={"filename"}
                    textField={upload.filename}
                    id={upload.id}
                    completed={false}
                  />
                  <Link
                    className="hover:text-muted-foreground flex items-center justify-center"
                    href={`/review/${upload.id}`}
                  >
                    <LinkIcon size={16} />
                  </Link>
                  <DeleteButton
                    id={upload.id}
                    variant="upload"
                    completed={false}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
