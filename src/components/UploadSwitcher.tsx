"use client";
import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	uploadAndGenerateAction,
	uploadRecordAction,
	uploadTableAction,
} from "../app/actions";
import type { StudyQuestion } from "../types";

type UploadMode = "pdf" | "text" | "xlsx";

const uploadModeOrder: UploadMode[] = ["pdf", "text", "xlsx"];
const switchTransition = "transition-all duration-300 ease-out";

const uploadModeConfig: Record<
	UploadMode,
	{
		label: string;
		submitLabel: string;
		loadingLabel: string;
		accept?: string;
		inputId?: string;
		fileLabel?: string;
		fileAriaLabel?: string;
	}
> = {
	pdf: {
		label: "PDF to Questions",
		submitLabel: "Generate Study Questions",
		loadingLabel: "Generating questions...",
		accept: "application/pdf",
		inputId: "pdf-upload",
		fileLabel: "Click to upload pdf",
		fileAriaLabel: "Upload pdf file",
	},
	text: {
		label: "Text to Questions",
		submitLabel: "Generate Study Questions",
		loadingLabel: "Generating questions...",
	},
	xlsx: {
		label: "XLSX to Table",
		submitLabel: "Upload Table",
		loadingLabel: "Uploading table...",
		accept:
			".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		inputId: "xlsx-upload",
		fileLabel: "Click to upload xlsx",
		fileAriaLabel: "Upload xlsx file",
	},
};

export default function UploadSwitcher() {
	const [mode, setMode] = useState<UploadMode>("pdf");
	const [file, setFile] = useState<File | null>(null);
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [textInput, setTextInput] = useState("");
	const activeMode = uploadModeConfig[mode];
	const modeIndex = uploadModeOrder.indexOf(mode);
	const isTextMode = mode === "text";
	const canSubmit = isTextMode ? textInput.trim().length > 0 : Boolean(file);

	function selectMode(nextMode: UploadMode) {
		setMode(nextMode);
		setFile(null);
		setError(null);
	}

	async function handleFileUpload(fileMode: "pdf" | "xlsx") {
		if (!file) return;
		setLoading(true);
		setError(null);

		const formData = new FormData();
		formData.append(fileMode, file);

		let intervalId: ReturnType<typeof setInterval> | null = null;

		if (fileMode === "pdf") {
			setProgress(0);
			const fileSizeMB = file.size / (1024 * 1024);
			const estimatedSeconds = Math.max(5, fileSizeMB * 10);
			const totalTicks = (estimatedSeconds * 1000) / 100;
			const incrementPerTick = 95 / totalTicks;

			intervalId = setInterval(() => {
				setProgress((prev) => Math.min(prev + incrementPerTick, 95));
			}, 100);
		}

		try {
			if (fileMode === "pdf") {
				await uploadAndGenerateAction(formData);
			} else {
				const result = await uploadTableAction(formData);
				router.push(`/table_uploads/${result.tableUploadId}`);
			}
		} catch (err) {
			console.error(`${fileMode.toUpperCase()} upload error:`, err);
			setError(
				err instanceof Error
					? err.message
					: fileMode === "pdf"
						? "Failed to generate questions"
						: "Failed to upload table",
			);
		} finally {
			if (intervalId) clearInterval(intervalId);
			setLoading(false);
		}
	}

	async function handleSubmit() {
		if (mode === "pdf") {
			await handleFileUpload("pdf");
		} else if (mode === "text") {
			await handleGenerate();
		} else {
			await handleFileUpload("xlsx");
		}
	}

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
					upload_id: "",
					question: line.slice(0, colonIndex).trim(),
					answer: line.slice(colonIndex + 1).trim(),
					displayOrder: 0,
				};
			})
			.filter(
				(
					pair,
				): pair is {
					id: string;
					upload_id: string;
					question: string;
					answer: string;
					displayOrder: number;
				} => pair !== null,
			);
		try {
			const upload = await uploadRecordAction("Untitled", questionList);
			router.push(`/uploads/${upload.id}`);
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
		<div className="flex min-h-0 w-200 flex-col gap-8 rounded-lg bg-muted p-8 shadow">
			<div className="relative grid grid-cols-3 overflow-hidden rounded-2xl border border-muted">
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 left-0 w-1/3 rounded-2xl bg-muted-hover transition-transform duration-300 ease-out"
					style={{ transform: `translateX(${modeIndex * 100}%)` }}
				/>
				{uploadModeOrder.map((modeOption) => (
					<button
						key={modeOption}
						className={`relative z-10 w-full cursor-pointer rounded-2xl py-2 transition-colors duration-200 ${
							mode === modeOption ? "text-foreground" : "text-foreground/70"
						}`}
						onClick={() => selectMode(modeOption)}
						type="button"
					>
						{uploadModeConfig[modeOption].label}
					</button>
				))}
			</div>

			{error && (
				<div
					className="h-28 overflow-y-auto rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-foreground shadow-sm"
					role="alert"
				>
					<p className="font-medium">Error</p>
					<p className="mt-1 text-sm whitespace-pre-wrap break-words">
						{error}
					</p>
				</div>
			)}
			<div
				className={`relative h-56 overflow-hidden rounded-lg border-2 border-dashed border-border ${switchTransition}`}
			>
				<div
					className={`absolute inset-0 ${switchTransition} ${
						isTextMode
							? "translate-y-0 opacity-100"
							: "pointer-events-none translate-y-2 opacity-0"
					}`}
				>
					<textarea
						className="h-full w-full resize-none rounded-lg bg-transparent p-4 outline-none"
						value={textInput}
						onChange={(e) => setTextInput(e.target.value)}
						placeholder={`Question 1:Answer 1
Question 2:Answer 2`}
					/>
				</div>

				<div
					className={`absolute inset-0 p-12 text-center ${switchTransition} ${
						!isTextMode
							? "translate-y-0 opacity-100"
							: "pointer-events-none -translate-y-2 opacity-0"
					}`}
				>
					{file ? (
						<div className="flex h-full flex-col items-center justify-center">
							<p className="mb-4 text-sm text-muted-foreground">{file.name}</p>
							<button
								type="button"
								onClick={() => {
									setFile(null);
									setError(null);
								}}
								className="text-sm text-primary hover:underline"
							>
								Remove
							</button>
						</div>
					) : (
						<div className="flex h-full items-center justify-center">
							<input
								type="file"
								accept={activeMode.accept}
								onChange={handleFileChange}
								className="hidden"
								id={activeMode.inputId}
								aria-label={activeMode.fileAriaLabel}
							/>
							<label
								htmlFor={activeMode.inputId}
								className="flex cursor-pointer flex-col items-center text-muted-foreground hover:text-foreground"
							>
								<FileUp size={16} className="mb-4" />
								<div className="font-medium">{activeMode.fileLabel}</div>
							</label>
						</div>
					)}
				</div>
			</div>
			<div
				className={`origin-center overflow-hidden ${switchTransition} ${
					canSubmit ? "h-12" : "pointer-events-none -mt-4 -mb-4 h-0"
				}`}
			>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={loading}
					className="w-full rounded-sm bg-primary py-3 font-medium text-primary-foreground hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Generate study questions from uploaded file"
				>
					{loading ? activeMode.loadingLabel : activeMode.submitLabel}
				</button>
			</div>
			{loading && mode === "pdf" && (
				<div className="space-y-2">
					<div className="flex justify-between text-sm text-muted-foreground">
						<span>Processing slides...</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<div className="h-2 w-full rounded-full bg-muted">
						<div
							className="h-2 rounded-full bg-primary transition-all duration-300"
							style={{ width: `${progress}%` }}
							role="progressbar"
							aria-valuenow={Math.round(progress)}
							aria-valuemin={0}
							aria-valuemax={100}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
