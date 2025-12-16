"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudyQuestion } from "./api/generate-questions/route";
import { Tables } from "@/database.types";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploads, setUploads] = useState<Tables<"uploads">[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    const fetchUploads = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("uploads").select();

      if (error) {
        setError(error.message);
      } else {
        setUploads(data);
      }
    };

    fetchUploads();
  }, []);

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
      //add edit button here
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
      const { data: upload } = await supabase
        .from("uploads")
        .insert({
          filename: file.name,
          page_count: data.questions.length,
        })
        .select()
        .single();

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">
          Study Sesh
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Upload PowerPoint png to generate study questions
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
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
          <div className="mt-6">
            {error && <div className="text-red-600">Error: {error}</div>}
            {uploads.length > 0 && (
              <div>
                <h2 className="font-semibold mb-2 text-black dark:text-white">
                  Saved Uploads:
                </h2>
                <ul className="space-y-1">
                  {uploads.map((item, index) => (
                    <Link key={index} href={`/review/${item.id}`}>
                      {item.filename}
                    </Link>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
