"use client"
import { useState } from "react";
import { Tables } from "../types/database.types";
import { Folder, FolderOpen } from "lucide-react";
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
    <div className="transition-transform duration-300">
      {foldersWithUploads.map((folder) => (
        <div className="" key={folder.id}>
          <li
            className="flex text-base items-end gap-2 cursor-pointer hover:text-muted-foreground transition-colors"
            onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
          >
            <b>{folder.name}</b>
            {openFolder === folder.id ? (
              <FolderOpen size={19} className="" />
            ) : (
              <Folder size={19} className=" hover:scale-110" />
            )}
          </li>

          <div className={`grid transition-all duration-200 ${openFolder === folder.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <ul className="space-y-1 pl-6 overflow-hidden min-h-0">
              {folder.uploads.map((upload) => (
                <Link
                  key={upload.id}
                  className="flex justify-between items-center"
                  href={`/review/${upload.id}`}

                >
                  <EditField
                    variant={"filename"}
                    textField={upload.filename}
                    id={upload.id}
                    completed={false}
                  />
                  <DeleteButton
                    id={upload.id}
                    variant="upload"
                    completed={false}
                  />
                </Link>
              ))}
            </ul>
          </div>
        </div>
      ))
      }
    </div >
  );
}
