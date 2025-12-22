"use client";
import { useState, useMemo } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import { StudyQuestion } from "../types";
import parseAPNG from "apng-js";

export default function UploadButton() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("png", file);

    const png = formData.get("png") as File;
    const arrayBuffer = await png.arrayBuffer();
    const apng = parseAPNG(arrayBuffer);

    if (apng instanceof Error) {
      console.error("Not APNG");
      setError("Invalid PNG/APNG file");
      setLoading(false);
      return;
    }

    const frameCount = apng.frames.length;
    const totalTime = frameCount * 250;
    const updateInterval = 100;
    const totalTicks = totalTime / updateInterval;
    const incrementPerTick = 95 / totalTicks;
    const intervalId = setInterval(() => {
      setProgress((prevProgress) =>
        Math.min(prevProgress + incrementPerTick, 95),
      );
    }, updateInterval);

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
          throw new Error(
            errorData.error || errorData.details || "Unknown error",
          );
        } catch {
          throw new Error(`API error (${res.status}): ${text}`);
        }
      }

      const data = await res.json();
      console.log("API response:", data);

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
        throw new Error("Failed to save upload to database");
      }

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(
          data.questions.map((q: StudyQuestion) => ({
            upload_id: upload.id,
            page_number: q.pageNumber,
            question_text: q.question,
            answer_text: q.answer,
          })),
        )
        .select();

      if (questionsError) {
        console.error("Error inserting questions:", questionsError);
        throw new Error("Failed to save questions to database");
      }

      setProgress(100);
      router.push(`/review/${upload.id}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate questions",
      );
    } finally {
      clearInterval(intervalId);
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
      {error && (
        <div
          className="mb-4 bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded-lg"
          role="alert"
        >
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="border-dashed border-2 border-border rounded-lg p-12 text-center">
        {file ? (
          <div>
            <p className="text-sm text-muted-foreground mb-4">{file.name}</p>
            <button
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="text-sm text-error hover:underline"
              aria-label="Remove selected file"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept="image/png"
              onChange={handleFileChange}
              className="hidden"
              id="png-upload"
              aria-label="Upload PNG file"
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
          className="w-full mt-6 bg-button-primary text-button-primary-foreground py-3 rounded-lg font-medium hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Generate study questions from uploaded file"
        >
          {loading ? "Generating questions..." : "Generate Study Questions"}
        </button>
      )}
      {loading && (
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Processing slides...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-button-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}
    </>
  );
}
