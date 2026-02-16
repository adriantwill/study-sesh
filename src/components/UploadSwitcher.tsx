"use client"
import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadAndGenerateAction, uploadRecordAction } from "../app/actions";
import type { StudyQuestion } from "../types";

export default function UploadSwitcher() {
  const [selectedOption, setSelectedOption] = useState<0 | 1>(0);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const showGenerateButton = Boolean(file) || selectedOption === 1;

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("pdf", file);

    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedSeconds = Math.max(5, fileSizeMB * 10);
    const totalTicks = (estimatedSeconds * 1000) / 100;
    const incrementPerTick = 95 / totalTicks;

    const intervalId = setInterval(() => {
      setProgress((prev) => Math.min(prev + incrementPerTick, 95));
    }, 100);

    try {
      const result = await uploadAndGenerateAction(formData);
      setProgress(100);
      router.push(`/${result.uploadId}`);
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

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const questionList: StudyQuestion[] = textInput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
          return null;
        }

        return {
          id: crypto.randomUUID(),
          question: line.slice(0, colonIndex).trim(),
          answer: line.slice(colonIndex + 1).trim(),
        };
      })
      .filter(
        (pair): pair is { id: string; question: string; answer: string } =>
          pair !== null,
      );
    try {
      const upload = await uploadRecordAction("Untitled", questionList);
      router.push(`/${upload.id}`);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate questions",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <div className="relative grid grid-cols-2 overflow-hidden rounded-2xl border border-muted-hover">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-2xl bg-muted-hover transition-transform duration-300 ease-out ${selectedOption === 0 ? "translate-x-0" : "translate-x-full"
            }`}
        />
        {([0, 1] as const).map((option) => (
          <button
            key={option}
            className={`relative z-10 text-foreground py-2 w-full cursor-pointer rounded-2xl transition-colors duration-200 ${selectedOption === option ? "text-foreground" : "text-foreground/70"
              }`}
            onClick={() => setSelectedOption(option)}
            type="button"
          >
            {option === 0 ? "PDF" : "Text"} to Questions
          </button>
        ))}
      </div>

      {error && ( //upload butotn below
        <div
          className="mb-4 bg-red-900/20 border border-red-900 text-red-200 px-4 py-3 rounded-lg"
          role="alert"
        >
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div
        className={`border-dashed border-2 border-border rounded-lg transition-all duration-300 ease-out ${selectedOption === 1 ? "h-64 p-0" : "h-48 p-12 text-center"
          }`}
      >
        {selectedOption === 1 ? (
          <textarea
            className="h-full w-full resize-none rounded-lg bg-transparent p-4 outline-none"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={`Question 1:Answer 1
Question 2:Answer 2`}
          />
        ) : file ? (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-4">{file.name}</p>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="text-sm text-error hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
              aria-label="Upload pdf file"
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer text-muted-foreground hover:text-foreground flex flex-col items-center"
            >
              <FileUp size={16} className="mb-4" />
              <div className="font-medium">Click to upload pdf</div>
            </label>
          </div>
        )}
      </div>
      <div
        className={`origin-center overflow-hidden transition-[height] duration-300 ease-out ${showGenerateButton
          ? " h-12"
          : "h-0 mb-0 pointer-events-none"
          }`}
      >
        <button
          type="button"
          onClick={selectedOption === 0 ? handleUpload : handleGenerate}
          disabled={loading}
          className="w-full bg-button-primary text-button-primary-foreground py-3 rounded-lg font-medium hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Generate study questions from uploaded file"
        >
          {loading ? "Generating questions..." : "Generate Study Questions"}
        </button>
      </div>
      {loading && selectedOption === 0 && (
        <div className="space-y-2">
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
