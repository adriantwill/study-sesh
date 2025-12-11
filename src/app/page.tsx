"use client";

import { useState } from "react";
import { StudyQuestion } from "./api/generate-questions/route";
import ReviewMode from "../components/ReviewMode";
import QuizMode from "../components/QuizMode";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [mode, setMode] = useState<"upload" | "review" | "quiz">("upload");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

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
      console.log(data);
      setQuestions(data.questions || []);
      setMode("review");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "review") {
    return (
      <ReviewMode
        questions={questions}
        onStartQuiz={() => setMode("quiz")}
        onReset={() => {
          setMode("upload");
          setQuestions([]);
          setFile(null);
        }}
      />
    );
  }

  if (mode === "quiz") {
    return (
      <QuizMode
        questions={questions}
        onBack={() => setMode("review")}
        onReset={() => {
          setMode("upload");
          setQuestions([]);
          setFile(null);
        }}
      />
    );
  }

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
        </div>
      </div>
    </div>
  );
}
