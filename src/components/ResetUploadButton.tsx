"use client";
import { useRouter } from "next/navigation";

export default function ResetUploadButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="border border-border px-6 py-2 rounded-lg font-medium hover:bg-muted-hover"
    >
      New Upload
    </button>
  );
}
