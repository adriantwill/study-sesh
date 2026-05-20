import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { Poppler } from "node-poppler";
import { uploadRecordAction } from "../questions";
import { createClient } from "../supabase/server";

export async function generateWrongOptions(
	question: string,
	answer: string,
	questionId: string,
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

	const supabase = await createClient();
	const { data: updatedQuestion, error: updateError } = await supabase
		.from("questions")
		.update({ options })
		.eq("id", questionId)
		.select("upload_id")
		.single();

	if (updateError || !updatedQuestion) {
		console.error("Wrong options update error:", updateError);
		throw new Error("Failed to save wrong options");
	}

	revalidatePath(`/uploads/${updatedQuestion.upload_id}`);
	revalidatePath(`/quiz/${updatedQuestion.upload_id}`);
	revalidatePath(`/study/${updatedQuestion.upload_id}`);

	return options;
}

//TODO optimize the pdf cario thing
export async function generateQuestions(pdfBuffer: Buffer, uploadId: string) {
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

		// Process in batches of 2 to avoid rate limiting
		for (let i = 0; i < slideImages.length; i += 2) {
			const batch = slideImages.slice(i, i + 2);
			await Promise.all(
				batch.map(async ({ fileName, pageNumber }) => {
					const imagePath = path.join(tempDir, fileName);

					try {
						const imageBuffer = await fs.readFile(imagePath);

						const base64Img = imageBuffer.toString("base64");

						// Clean up image immediately after reading
						await fs.unlink(imagePath).catch(() => {});

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

For each question, generate exactly 3 wrong but plausible options based on the slide.
Rules for options:
- Must be incorrect
- Do not paraphrase or restate the correct answer
- Do not use "all/none of the above"
- Keep length similar to correct answer
- Avoid copying long phrases verbatim from the slide
- Skip the slide if it has no testable content

Return JSON array only:
[
  {
    "question": "Question here",
    "answer": "Concise answer without repeating the question",
    "options": ["Wrong but plausible 1", "Wrong but plausible 2", "Wrong but plausible 3"]
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
												required: ["question", "answer", "options"],
												propertyOrdering: ["question", "answer", "options"],
												properties: {
													question: {
														type: "STRING",
													},
													answer: {
														type: "STRING",
													},
													options: {
														type: "ARRAY",
														minItems: 3,
														maxItems: 3,
														items: {
															type: "STRING",
														},
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

						const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
						if (!content) {
							console.warn("Empty Gemini content", {
								fileName,
								parts: response.candidates?.[0]?.content?.parts,
							});
							return;
						}

						const pageQuestions = JSON.parse(content) as Array<{
							question: string;
							answer: string;
							options: string[];
						}>;

						const questions = pageQuestions.map((q) => ({
							id: "id", // Placeholder
							upload_id: "",
							question: q.question,
							answer: q.answer,
							displayOrder: 0,
							options: q.options,
							pageNumber,
							ocrText: null,
							originalQuestion: q.question,
						}));
						const inserted = await uploadRecordAction(uploadId, questions, i);
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
