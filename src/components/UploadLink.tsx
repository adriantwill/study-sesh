"use client";

import Link from "next/link";
import type { Tables } from "../types/database.types";
import DeleteButton from "./DeleteButton";
import { useState } from "react";

interface UploadLinkProps {
  upload: Tables<"uploads">;
  tree?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (uploadId: string) => void;
  onDragEnd?: () => void;
  onDelete?: (uploadId: string) => Promise<void> | void;
}

export default function UploadLink({
  upload,
  tree = false,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDelete,
}: UploadLinkProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  function displayElement(id: string) {
    setIsDeleting(id);
  }
  return (
    <li
      id={upload.id}
      draggable={draggable}
      onDragStart={() => onDragStart?.(upload.id)}
      onDragEnd={onDragEnd}
      className={`${isDeleting === upload.id ? "hidden" : ""} ${tree ? "py-1 pl-4" : "mt-2"} ${draggable ? "cursor-grab" : ""} ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex min-h-12 items-center justify-between rounded-md px-2 text-lg hover:bg-muted-hover duration-200 py-1">
        <Link href={`/${upload.id}`} className="overflow-x-hidden text-foreground/85 transition-colors hover:text-foreground">
          {upload.filename}
        </Link>
        <div className="flex items-center gap-3 text-foreground/70">
          <DeleteButton
            id={upload.id}
            variant="upload"
            name={upload.filename}
            displayElement={() => displayElement(upload.id)}
          />
        </div>
      </div>
    </li>
  );
}
