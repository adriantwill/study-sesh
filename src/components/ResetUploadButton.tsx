"use client";
import { useRouter } from "next/navigation";

export default function ResetUploadButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="border border-zinc-300 dark:border-zinc-700 px-6 py-2 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
    >
      New Upload
    </button>
  );
}
