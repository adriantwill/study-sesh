import fs from "node:fs/promises";
import path from "node:path";
import { Poppler } from "node-poppler";
import type { StudyQuestion } from "@/src/types";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
async function requestQuestionsFromGemini(imageBase64: string) {
  const apiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
                inline_data: {
                  mime_type: "image/png",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 512,
          temperature: 0.1,
          topP: 0.001,
        },
      }),
    },
  );

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text().catch(() => "");
    throw new Error(
      `API error: ${apiResponse.status} ${apiResponse.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
    );
  }

  return apiResponse.json();
}

//TODO optimize the pdf cario thing
export async function generateQuestions(file: File): Promise<StudyQuestion[]> {
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
            // Clean up image immediately after reading
            await fs.unlink(imagePath).catch(() => { });

            const response = await requestQuestionsFromGemini(base64Img);
            console.log(`Gemini API response received`);

            const content = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
            const jsonMatch = content.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
              const pageQuestions = JSON.parse(jsonMatch[0]) as Array<{
                question: string;
                answer: string;
                options: string[];
              }>;

              return pageQuestions.map((q) => ({
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
    try {
      await fs.unlink(pdfPath).catch(() => { });
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
