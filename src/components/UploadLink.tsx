"use client"
import { Tables } from "../types/database.types";
import DeleteButton from "./DeleteButton";
import EditField from "./EditField";

interface UploadLinkProps {
  upload: Tables<"uploads">;
}

export default function UploadLink({ upload }: UploadLinkProps) {
  return (
    <li
      className="flex justify-between items-center"
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
    </li>
  );
}
