import fs from "node:fs/promises";
import path from "node:path";
import { Poppler } from "node-poppler";
import type { StudyQuestion } from "@/src/types";

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_API_RETRIES = 3;

function isRetryableHyperbolicError(message: string) {
  return (
    message.includes("AsyncEngineDeadError") ||
    message.includes("Background loop is not running") ||
    message.includes("50001")
  );
}

function shouldRetryRequest(status: number, errorBody: string) {
  return (
    RETRYABLE_STATUS_CODES.has(status) || isRetryableHyperbolicError(errorBody)
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestQuestionsFromHyperbolic(imageUrl: string) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_API_RETRIES; attempt++) {
    try {
      const apiResponse = await fetch(
        "https://api.hyperbolic.xyz/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HYPERBOLIC_API_KEY}`,
          },
          body: JSON.stringify({
            model: "mistralai/Pixtral-12B-2409",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this educational slide and generate 2-3 flashcard-style questions targeting key facts, definitions, and terms a student would need to memorize for an exam.
                      Focus on:
                      - Definitions and terminology
                      - Key facts, dates, or formulas
                      - Lists or steps to memorize

                      For each question, generate exactly 3 wrong but plausible options based on the slide.
                      Rules for options:
                      - Must be incorrect
                      - Do not paraphrase or restate the correct answer
                      - Do not use “all/none of the above”
                      - Keep length similar to correct answer
                      - Avoid copying long phrases verbatim from the slide

                      Format as JSON array:
                      [
                        {
                          "question": "Question here",
                          "answer": "Concise answer without repeating the question",
                          "options": ["Wrong but plausible 1", "Wrong but plausible 2", "Wrong but plausible 3"]
                        }
                      ]

                      Rules:
                      - Only return valid JSON, no additional text
                      - Do not reiterate the question in the answer in any way`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            max_tokens: 512,
            temperature: 0.1,
            top_p: 0.001,
            stream: false,
          }),
        },
      );

      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text().catch(() => "");
        const error = new Error(
          `API error: ${apiResponse.status} ${apiResponse.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
        );

        if (
          attempt < MAX_API_RETRIES &&
          shouldRetryRequest(apiResponse.status, errorBody)
        ) {
          await sleep(attempt * 1000);
          lastError = error;
          continue;
        }

        throw error;
      }

      return apiResponse.json();
    } catch (error) {
      if (
        attempt < MAX_API_RETRIES &&
        error instanceof Error &&
        isRetryableHyperbolicError(error.message)
      ) {
        await sleep(attempt * 1000);
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Hyperbolic request failed");
}

//TODO optimize the pdf cario thing
export async function generateQuestions(file: File): Promise<StudyQuestion[]> {
  if (!process.env.HYPERBOLIC_API_KEY) {
    throw new Error("HYPERBOLIC_API_KEY not configured");
  }

  // Generate a unique temporary file path
  const tempDir = path.join(process.cwd(), "temp");
  await fs.mkdir(tempDir, { recursive: true });

  const fileId = Math.random().toString(36).substring(7);
  const pdfPath = path.join(tempDir, `upload-${fileId}.pdf`);
  const outputPrefix = path.join(tempDir, `slides-${fileId}`);

  try {
    // Write buffer to temp file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(pdfPath, buffer);

    console.log(`Saved temporary PDF to ${pdfPath}`);

    const poppler = new Poppler();

    // Convert PDF to PNGs using pdftocairo
    // We want to skip the first 2 pages, so we start converting from page 3.
    // pdftocairo options: -f (first page), -l (last page), -png

    const options = {
      firstPageToConvert: 3,
      pngFile: true,
      scalePageTo: 1024,
    };

    await poppler.pdfToCairo(pdfPath, outputPrefix, options);

    // Process each generated image by reading the directory
    const allFiles = await fs.readdir(tempDir);
    const imageFiles = allFiles
      .filter((f) => f.startsWith(`slides-${fileId}`) && f.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const allQuestions: StudyQuestion[] = [];
    const failedSlides: string[] = [];

    // Process in batches of 2 to avoid rate limiting
    for (let i = 0; i < imageFiles.length; i += 2) {
      const batch = imageFiles.slice(i, i + 2);
      const batchResults = await Promise.all(
        batch.map(async (fileName) => {
          const imagePath = path.join(tempDir, fileName);
          const pageMatch = fileName.match(/-(\d+)\.png$/);
          const pageNumber = pageMatch ? Number(pageMatch[1]) : null;

          try {
            const imageBuffer = await fs.readFile(imagePath);

            const base64Img = imageBuffer.toString("base64");
            const imageUrl = `data:image/png;base64,${base64Img}`;

            // Clean up image immediately after reading
            await fs.unlink(imagePath).catch(() => { });

            const response = await requestQuestionsFromHyperbolic(imageUrl);
            console.log(`Hyperbolic API response received`);

            const content = response.choices[0]?.message?.content || "";
            const jsonMatch = content.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
              const pageQuestions = JSON.parse(jsonMatch[0]) as Array<{
                question: string;
                answer: string;
                options: string[];
              }>;

              return pageQuestions.map((q) => ({
                id: "id", // Placeholder
                question: q.question,
                answer: q.answer,
                options: q.options,
                pageNumber,
                ocrText: null,
                originalQuestion: q.question,
              }));
            }
            return [];
          } catch (err) {
            console.error(`Error processing slide`, err);
            failedSlides.push(
              err instanceof Error
                ? pageNumber
                  ? `slide ${pageNumber}: ${err.message}`
                  : `unknown slide: ${err.message}`
                : pageNumber
                  ? `slide ${pageNumber}`
                  : "unknown slide",
            );
            return [];
          }
        }),
      );
      allQuestions.push(...batchResults.flat());
    }

    if (allQuestions.length === 0 && failedSlides.length > 0) {
      throw new Error(
        `Question generation failed after retries. ${failedSlides.slice(0, 3).join("; ")}`,
      );
    }

    if (failedSlides.length > 0) {
      console.warn(
        `Skipped slides during question generation: ${failedSlides.join("; ")}`,
      );
    }

    return allQuestions;
  } catch (error) {
    console.error("Error in generateQuestions:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unable to find darwin Poppler binaries")
    ) {
      throw new Error(
        "Poppler not installed on this machine. Install poppler so PDF slides can be converted.",
      );
    }
    throw error;
  } finally {
    // Final Cleanup
    try {
      await fs.unlink(pdfPath).catch(() => { });
      // Try to cleanup any remaining images
      const dirFiles = await fs.readdir(tempDir);
      for (const file of dirFiles) {
        if (file.startsWith(`slides-${fileId}`)) {
          await fs.unlink(path.join(tempDir, file)).catch(() => { });
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
  }
}
