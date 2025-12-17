"use client";
import { useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { StudyQuestion } from "../app/api/generate-questions/route";

export default function UploadButton() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("png", file);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("API error response:", text);
        try {
          const errorData = JSON.parse(text);
          alert(
            `Error: ${errorData.error || errorData.details || "Unknown error"}`,
          );
        } catch {
          alert(`API error (${res.status}): ${text}`);
        }
        return;
      }
      const data = await res.json();
      const supabase = createClient();
      const { data: upload, error } = await supabase
        .from("uploads")
        .insert({
          filename: file.name,
          page_count: data.questions.length,
        })
        .select()
        .single();
      if (error) {
        console.error("Error fetching uploads:", error);
        return null;
      }
      await supabase
        .from("questions")
        .insert(
          data.questions.map((q: StudyQuestion) => ({
            upload_id: upload.id,
            page_number: q.pageNumber,
            question_text: q.question,
            answer_text: q.answer,
            context: q.slideContext,
          })),
        )
        .select();

      router.push(`/review/${upload.id}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };
  return (
    <div>
      <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-12 text-center">
        {file ? (
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              {file.name}
            </p>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="application/png"
              onChange={handleFileChange}
              className="hidden"
              id="png-upload"
            />
            <label
              htmlFor="png-upload"
              className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            >
              <div className="text-4xl mb-4">📄</div>
              <div className="font-medium">Click to upload png</div>
              <div className="text-sm mt-2">or drag and drop</div>
            </label>
          </div>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full mt-6 bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating questions..." : "Generate Study Questions"}
        </button>
      )}
    </div>
  );
}
