"use client";

import Link from "next/link";
import type { Tables } from "../types/database.types";
import DeleteButton from "./DeleteButton";

interface UploadLinkProps {
  upload: Tables<"uploads">;
  folders: Tables<"folders">[];
  tree?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (uploadId: string) => void;
  onDragEnd?: () => void;
}

export default function UploadLink({
  upload,
  tree = false,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: UploadLinkProps) {
  return (
    <li
      draggable={draggable}
      onDragStart={() => onDragStart?.(upload.id)}
      onDragEnd={onDragEnd}
      className={`${tree ? "relative py-1 pl-4" : "mt-2"} ${draggable ? "cursor-grab" : ""} ${isDragging ? "opacity-40" : ""}`}
    >
      {tree && <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-border/50" />}
      <div className="flex min-h-12 items-center justify-between rounded-md px-2 text-lg hover:bg-background/60">
        <Link href={`/${upload.id}`} className="overflow-x-hidden text-foreground/85 transition-colors hover:text-foreground">
          {upload.filename}
        </Link>
        <div className="flex items-center gap-3 text-foreground/70">
          <DeleteButton id={upload.id} variant="upload" name={upload.filename} />
        </div>
      </div>
    </li>
  );
}
