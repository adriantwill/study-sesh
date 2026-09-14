import fs from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Poppler } from "node-poppler";
import type { Question } from "@/src/types";

type UploadRecord = (
	uploadId: string,
	questions: Question[],
	position: number,
) => Promise<number>;

async function generateSlideQuestions(
	imageBase64: string,
	apiKey: string,
	endpointId: string,
): Promise<Array<{ question: string; answer: string }>> {
	const endpoint = `https://api.runpod.ai/v2/${endpointId}`;
	const deadline = Date.now() + 900_000;
	const request = async (url: string, body?: string) => {
		const remaining = deadline - Date.now();
		if (remaining <= 0) {
			throw new Error("RunPod job exceeded 15-minute wait limit");
		}
		const response = await fetch(url, {
			method: body === undefined ? "GET" : "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body,
			signal: AbortSignal.timeout(Math.min(60_000, remaining)),
		});
		if (!response.ok) {
			throw new Error(
				`RunPod returned HTTP ${response.status}: ${await response.text()}`,
			);
		}
		return response.json();
	};

	const submitted = await request(
		`${endpoint}/run`,
		JSON.stringify({ input: { image_base64: imageBase64 } }),
	);

	const result = await request(`${endpoint}/status/${submitted.id}`);
	while (Date.now() < deadline) {
		const result = await request(`${endpoint}/status/${submitted.id}`);
		if (result.status === "COMPLETED") {
			const flashcards = result.output?.flashcards;
			if (!Array.isArray(flashcards)) {
				throw new Error("RunPod output did not include a flashcards array");
			}
			return flashcards.map((card) => {
				if (
					typeof card?.question !== "string" ||
					!card.question.trim() ||
					typeof card?.answer !== "string" ||
					!card.answer.trim()
				) {
					throw new Error("RunPod flashcard has an invalid question or answer");
				}
				return { question: card.question, answer: card.answer };
			});
		}
		if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(result.status)) {
			throw new Error(
				`RunPod job ${result.status}: ${JSON.stringify(result.error ?? "No error details")}`,
			);
		}
		await delay(5000);
	}
	throw new Error("RunPod job exceeded 15-minute wait limit");
}

//TODO optimize the pdf cario thing
export async function generateQuestions(
	pdfBuffer: Buffer,
	uploadId: string,
	uploadRecord: UploadRecord,
) {
	const apiKey = process.env.RUNPOD_API_KEY;
	const endpointId = process.env.RUNPOD_ENDPOINT_ID;
	if (!apiKey || !endpointId) {
		throw new Error("RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID must be configured");
	}

	// Generate a unique temporary file path
	const tempDir = path.join(process.cwd(), "temp");
	await fs.mkdir(tempDir, { recursive: true });

	const fileId = Math.random().toString(36).substring(7);
	const pdfPath = path.join(tempDir, `upload-${fileId}.pdf`);
	const outputPrefix = path.join(tempDir, `slides-${fileId}`);

	try {
		// Write buffer to temp file
		await fs.writeFile(pdfPath, pdfBuffer);

		const poppler = new Poppler();

		// Convert PDF to PNGs using pdftocairo
		// We want to skip the first 2 pages, so we start converting from page 3.
		// pdftocairo options: -f (first page), -l (last page), -png

		const firstPageToConvert = 3;
		const options = {
			firstPageToConvert,
			pngFile: true,
			scalePageTo: 1024,
		};

		try {
			await poppler.pdfToCairo(pdfPath, outputPrefix, options);
		} catch (error) {
			console.error("PDF conversion failed:", error);
			throw new Error("Failed to convert PDF to slide images");
		}

		// Process each generated image by reading the directory
		const allFiles = await fs.readdir(tempDir);
		const imageFiles = allFiles
			.filter((f) => f.startsWith(`slides-${fileId}`) && f.endsWith(".png"))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
		const slideImages = imageFiles.map((fileName, index) => ({
			fileName,
			pageNumber: firstPageToConvert + index,
		}));
		let insertedCount = 0;
		let failedSlideCount = 0;

		// Process in batches of 2 to avoid rate limiting
		for (let i = 0; i < slideImages.length; i += 2) {
			const batch = slideImages.slice(i, i + 2);
			await Promise.all(
				batch.map(async ({ fileName, pageNumber }) => {
					const imagePath = path.join(tempDir, fileName);

					try {
						const imageBuffer = await fs.readFile(imagePath);
						if (imageBuffer.length > 10 * 1024 * 1024) {
							throw new Error("Image exceeds handler's 10 MB limit");
						}

						const base64Img = imageBuffer.toString("base64");

						// Clean up image immediately after reading
						await fs.unlink(imagePath).catch(() => {});

						const pageQuestions = await generateSlideQuestions(
							base64Img,
							apiKey,
							endpointId,
						);
						if (pageQuestions.length === 0) return;

						const questions: Question[] = pageQuestions.map((q) => ({
							id: "id", // Placeholder
							uploadId: "",
							questionText: q.question,
							modelUsed: "runpod",
							answerText: q.answer,
							createdAt: null,
							imageUrl: null,
							displayOrder: 0,
							options: [],
							pageNumber,
							ocrText: null,
							originalQuestionText: q.question,
							originalAnswerText: q.answer,
							deleted: false,
							fsrsDifficulty: 0,
							fsrsStability: 0,
							fsrsDueAt: new Date().toISOString(),
							fsrsLastReviewedAt: new Date().toISOString(),
							fsrsReviewCount: 0,
							fsrsState: 0,
							fsrsScheduled: 0,
							fsrsLearning: 0,
							fsrsLapses: 0,
						}));
						const inserted = await uploadRecord(uploadId, questions, i);
						insertedCount += inserted;
					} catch (err) {
						failedSlideCount += 1;
						console.error("Error processing slide", {
							fileName,
							error: err,
						});
					}
				}),
			);
			// allQuestions.push(...batchResults.flat());
		}

		if (insertedCount === 0) {
			throw new Error(
				failedSlideCount > 0
					? "All slides failed to generate questions"
					: "No questions generated from this PDF",
			);
		}
	} catch (error) {
		console.error("Error in generateQuestions:", error);
		throw error;
	} finally {
		try {
			await fs.unlink(pdfPath).catch(() => {});
			const dirFiles = await fs.readdir(tempDir);
			for (const file of dirFiles) {
				if (file.startsWith(`slides-${fileId}`)) {
					await fs.unlink(path.join(tempDir, file)).catch(() => {});
				}
			}
		} catch (cleanupError) {
			console.error("Cleanup error:", cleanupError);
		}
	}
}
