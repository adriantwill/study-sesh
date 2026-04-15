import fs from "node:fs/promises";
import path from "node:path";
import { Poppler } from "node-poppler";
import type { StudyQuestion } from "@/src/types";

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
    const imageFiles = allFiles.filter(
      (f) => f.startsWith(`slides-${fileId}`) && f.endsWith(".png"),
    );

    const allQuestions: StudyQuestion[] = [];

    // Process in batches of 2 to avoid rate limiting
    for (let i = 0; i < imageFiles.length; i += 2) {
      const batch = imageFiles.slice(i, i + 2);
      const batchResults = await Promise.all(
        batch.map(async (fileName) => {
          const imagePath = path.join(tempDir, fileName);

          try {
            const imageBuffer = await fs.readFile(imagePath);

            const base64Img = imageBuffer.toString("base64");

            // Clean up image immediately after reading
            await fs.unlink(imagePath).catch(() => { });

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
              return [];
            }

            const pageQuestions = JSON.parse(content) as Array<{
              question: string;
              answer: string;
              options: string[];
            }>;

            return pageQuestions.map((q) => ({
              id: "id", // Placeholder
              question: q.question,
              answer: q.answer,
              options: q.options,
            }));
          } catch (err) {
            console.error("Error processing slide", {
              fileName,
              error: err,
            });
            return [];
          }
        }),
      );
      allQuestions.push(...batchResults.flat());
    }

    return allQuestions;
  } catch (error) {
    console.error("Error in generateQuestions:", error);
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
