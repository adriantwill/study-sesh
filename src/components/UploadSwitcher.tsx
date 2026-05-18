"use client";
import { FileUp, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	createUpload,
	uploadAndGenerateAction,
	uploadRecordActionTEMP,
	uploadTableAction,
} from "../app/actions";
import { signOutAction } from "../app/actions/auth";
import type { StudyQuestion } from "../types";
import SegmentedControl from "./SegmentedControl";

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

const uploadModeOptions = uploadModeOrder.map((modeOption) => ({
	label: uploadModeConfig[modeOption].label,
	value: modeOption,
}));

export default function UploadSwitcher() {
	const [mode, setMode] = useState<UploadMode>("pdf");
	const [file, setFile] = useState<File | null>(null);
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [textInput, setTextInput] = useState("");
	const activeMode = uploadModeConfig[mode];
	const isTextMode = mode === "text";
	const canSubmit = isTextMode ? textInput.trim().length > 0 : Boolean(file);

	function selectMode(nextMode: UploadMode) {
		setMode(nextMode);
		setFile(null);
	}
	//TODO clean up all unused code
	async function handleFileUpload(fileMode: "pdf" | "xlsx") {
		if (!file) return;

		const formData = new FormData();
		formData.append(fileMode, file);

		try {
			if (fileMode === "pdf") {
				const result = await uploadAndGenerateAction(formData);
				router.push(`/uploads/${result.uploadId}`);
			} else {
				const result = await uploadTableAction(formData);
				router.push(`/table_uploads/${result.tableUploadId}`);
			}
		} catch (err) {
			console.error(`${fileMode.toUpperCase()} upload error:`, err);
			alert("Error");
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
			const upload = await createUpload("Untitled");
			await uploadRecordActionTEMP(upload.id, questionList, 0);
			router.push(`/uploads/${upload.id}`);
		} catch (err) {
			console.error("Upload error:", err);
			alert("Error");
		} finally {
			setLoading(false);
		}
	}
	return (
		<div className="flex min-h-0 w-200 flex-col gap-8 rounded-lg bg-muted p-8 shadow">
			<button
				onClick={() => signOutAction()}
				className="absolute cursor-pointer top-8 right-8"
				type="button"
			>
				<LogOut size={35} />
			</button>
				<SegmentedControl
					ariaLabel="Choose upload type"
					options={uploadModeOptions}
					value={mode}
					onChange={selectMode}
				/>

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
			<button
				type="button"
				onClick={handleSubmit}
				disabled={loading}
				className={`origin-center overflow-hidden ${switchTransition} ${
					canSubmit ? "h-12" : "pointer-events-none -mt-4 -mb-4 h-0"
				} "w-full rounded-sm bg-primary  font-medium text-primary-foreground hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"`}
				aria-label="Generate study questions from uploaded file"
			>
				{loading ? activeMode.loadingLabel : activeMode.submitLabel}
			</button>
		</div>
	);
}
