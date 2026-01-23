"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { uploadAndGenerateAction } from "../app/actions";

export default function UploadButton() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("pdf", file);

    const fileSizeMB = file.size / (1024 * 1024);
    const estimatedSeconds = Math.max(5, fileSizeMB * 5);
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
              <div className="text-sm mt-2">or drag and drop</div>
            </label>
          </div>
        )}
      </div>

      {file && (
        <>
          <div className="mt-6 flex items-center gap-2 justify-between">
            <label htmlFor="public-checkbox" className="text-m text-foreground ">
              Make public
            </label>
            <input
              type="checkbox"
              id="public-checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 rounded-2 bg-background  cursor-pointer"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-6 bg-button-primary text-button-primary-foreground py-3 rounded-lg font-medium hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Generate study questions from uploaded file"
          >
            {loading ? "Generating questions..." : "Generate Study Questions"}
          </button>
        </>
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
