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

export async function generateWrongOptions(
	question: string,
	answer: string,
): Promise<string[]> {
	if (!process.env.GEMINI_API_KEY) {
		throw new Error("GEMINI_API_KEY not configured");
	}
	const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
	const apiResponse = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [
							{
								text: `Generate exactly 3 wrong but plausible multiple-choice options for this flashcard.

Question:
${question}

Correct answer:
${answer}

Rules:
- Each option must be incorrect
- Do not paraphrase or restate the correct answer
- Do not use "all/none of the above"
- Keep length similar to the correct answer
- Return JSON array only`,
							},
						],
					},
				],
				generationConfig: {
					temperature: 0.2,
					topP: 0.1,
					maxOutputTokens: 256,
					responseMimeType: "application/json",
					responseSchema: {
						type: "ARRAY",
						minItems: 3,
						maxItems: 3,
						items: {
							type: "STRING",
						},
					},
				},
			}),
		},
	);

	if (!apiResponse.ok) {
		const errorText = await apiResponse.text();
		console.error("Gemini wrong options HTTP error", {
			status: apiResponse.status,
			statusText: apiResponse.statusText,
			errorText,
		});
		throw new Error(
			`API error: ${apiResponse.status} ${apiResponse.statusText}`,
		);
	}

	const response = await apiResponse.json();
	const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
	if (!content) {
		console.warn("Empty Gemini wrong options content", {
			parts: response.candidates?.[0]?.content?.parts,
		});
		throw new Error("No wrong options generated");
	}

	const parsedOptions = JSON.parse(content);
	if (!Array.isArray(parsedOptions)) {
		throw new Error("Wrong options response was not an array");
	}

	const options = parsedOptions
		.filter((option): option is string => typeof option === "string")
		.map((option) => option.trim())
		.filter(Boolean)
		.slice(0, 3);

	if (options.length !== 3) {
		throw new Error("Wrong options response did not include exactly 3 options");
	}

	return options;
}

const request = async (
	url: string,
	body?: string,
	signal = AbortSignal.timeout(120_000),
) => {
	const response = await fetch(url, {
		method: body === undefined ? "GET" : "POST",
		headers: {
			Authorization: `Bearer ${process.env.RUNPODAPI}`,
			"Content-Type": "application/json",
		},
		body,
		signal,
	});
	if (!response.ok) {
		throw new Error(
			`RunPod returned HTTP ${response.status}: ${await response.text()}`,
		);
	}
	return response.json();
};
async function generateSlideQuestions(
	imageBase64: string,
): Promise<Array<{ question: string; answer: string }>> {
	const endpoint = `https://api.runpod.ai/v2/${process.env.ENDPOINT_ID}`;
	const signal = AbortSignal.timeout(120_000);
	let submitted = await request(
		`${endpoint}/run`,
		JSON.stringify({ input: { image_base64: imageBase64 } }),
		signal,
	);
	const id = submitted.id;
	while (submitted.status !== "COMPLETED") {
		if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(submitted.status)) {
			throw new Error(
				`RunPod job ${submitted.status}: ${JSON.stringify(submitted.error ?? "No error details")}`,
			);
		}
		await delay(5000, undefined, { signal });
		submitted = await request(`${endpoint}/status/${id}`, undefined, signal);
	}
	const flashcards = submitted.output?.flashcards;
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
//TODO optimize the pdf cario thing
export async function generateQuestions(
	pdfBuffer: Buffer,
	uploadId: string,
	uploadRecord: UploadRecord,
) {
	if (!process.env.GEMINI_API_KEY) {
		throw new Error("GEMINI_API_KEY not configured");
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
		let use_custom = false;
		// Process in batches of 2 to avoid rate limiting
		const endpoint = `https://api.runpod.ai/v2/${process.env.ENDPOINT_ID}`;
		const imagePath = path.join(tempDir, slideImages[0].fileName);
		const imageBuffer = await fs.readFile(imagePath);
		const base64Img = imageBuffer.toString("base64");
		let warmup = await request(
			`${endpoint}/run`,
			JSON.stringify({ input: { image_base64: base64Img } }),
		).catch(() => null);
		for (let i = 0; i < slideImages.length; i += 2) {
			if (!use_custom && warmup?.id) {
				warmup = await request(`${endpoint}/status/${warmup.id}`).catch(
					() => null,
				);
				use_custom =
					warmup?.status === "COMPLETED" &&
					Array.isArray(warmup.output?.flashcards);
				if (["FAILED", "CANCELLED", "TIMED_OUT"].includes(warmup?.status)) {
					warmup = null;
				}
			}
			const batch = slideImages.slice(i, i + 2);
			await Promise.all(
				batch.map(async ({ fileName, pageNumber }) => {
					const imagePath = path.join(tempDir, fileName);

					try {
						const imageBuffer = await fs.readFile(imagePath);

						const base64Img = imageBuffer.toString("base64");

						// Clean up image immediately after reading
						await fs.unlink(imagePath).catch(() => {});
						let pageQuestions: Array<{ question: string; answer: string }>;
						if (use_custom === false) {
							const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
							const apiResponse = await fetch(
								`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
								{
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({
										contents: [
											{
												parts: [
													{
														text: `Analyze this educational slide and generate 2-3 flashcard-style questions targeting key facts, definitions, and terms a student would need to memorize for an exam.
Focus on:
- Definitions and terminology
- Key facts, dates, or formulas
- Lists or steps to memorize

Question rules:
- Ask only direct, positive questions about content visible on the slide
- No filler framing: avoid "according to the slide", "in the context of...", "based on...", etc.
- Do not ask about absent content or exclusions: no "NOT", "except", "not mentioned", or "not a symptom/example"
- Avoid questions unrelated to the actual slide content, like names of institutions 

Return JSON array only:
[
  {
    "question": "Question here",
    "answer": "Concise answer without repeating the question",
  }
]`,
													},
													{
														inline_data: {
															mime_type: "image/png",
															data: base64Img,
														},
													},
												],
											},
										],
										generationConfig: {
											temperature: 0.1,
											topP: 0.1,
											maxOutputTokens: 512,
											responseMimeType: "application/json",
											responseSchema: {
												type: "ARRAY",
												items: {
													type: "OBJECT",
													required: ["question", "answer"],
													propertyOrdering: ["question", "answer"],
													properties: {
														question: {
															type: "STRING",
														},
														answer: {
															type: "STRING",
														},
													},
												},
											},
										},
									}),
								},
							);
							if (!apiResponse.ok) {
								const errorText = await apiResponse.text();
								console.error("Gemini HTTP error", {
									fileName,
									status: apiResponse.status,
									statusText: apiResponse.statusText,
									errorText,
								});
								throw new Error(
									`API error: ${apiResponse.status} ${apiResponse.statusText}`,
								);
							}

							const response = await apiResponse.json();

							const content =
								response.candidates?.[0]?.content?.parts?.[0]?.text;
							if (!content) {
								console.warn("Empty Gemini content", {
									fileName,
									parts: response.candidates?.[0]?.content?.parts,
								});
								return;
							}

							pageQuestions = JSON.parse(content) as Array<{
								question: string;
								answer: string;
							}>;
						} else {
							pageQuestions = await generateSlideQuestions(base64Img);
						}

						const questions: Question[] = pageQuestions.map((q) => ({
							id: "id", // Placeholder
							uploadId: "",
							questionText: q.question,
							modelUsed: use_custom ? "runpod" : "gemini",
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
