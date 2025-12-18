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
      console.log("API response:", data);

      const supabase = createClient();
      const { data: upload, error: uploadError } = await supabase
        .from("uploads")
        .insert({
          filename: file.name,
          page_count: data.questions.length,
        })
        .select()
        .single();

      if (uploadError || !upload) {
        console.error("Error inserting upload:", uploadError);
        alert("Failed to save upload to database");
        return;
      }

      console.log("Upload created:", upload);

      const { error: questionsError } = await supabase
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

      if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        alert("Failed to save questions to database");
        return;
      }

      console.log("Navigating to review page...");
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
    <>
      <div className="border-dashed border-2 border-border rounded-lg p-12 text-center">
        {file ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{file.name}</p>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-error hover:underline"
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
              className="cursor-pointer text-muted-foreground hover:text-foreground"
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
          className="w-full mt-6 bg-button-primary text-button-primary-foreground py-3 rounded-lg font-medium hover:bg-muted-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Generating questions..." : "Generate Study Questions"}
        </button>
      )}
    </>
  );
}
