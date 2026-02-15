import fs from "node:fs/promises";
import path from "node:path";
import { Poppler } from "node-poppler";
import type { StudyQuestion } from "@/src/types";

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
            const imageUrl = `data:image/png;base64,${base64Img}`;

            // Clean up image immediately after reading
            await fs.unlink(imagePath).catch(() => { });

            const apiResponse = await fetch(
              "https://api.hyperbolic.xyz/v1/chat/completions",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.HYPERBOLIC_API_KEY}`,
                },
                body: JSON.stringify({
                  model: "Qwen/Qwen2.5-VL-7B-Instruct",
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
                          //maybe add: Skip if the slide has no testable content (title slides, "questions?" slides, images without text).
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
              throw new Error(
                `API error: ${apiResponse.status} ${apiResponse.statusText}`,
              );
            }

            const response = await apiResponse.json();
            console.log(`Hyperbolic API response received`);

            const content = response.choices[0]?.message?.content || "";
            const jsonMatch = content.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
              const pageQuestions = JSON.parse(jsonMatch[0]) as Array<{
                question: string;
                answer: string;
              }>;

              return pageQuestions.map((q) => ({
                id: "id", // Placeholder
                question: q.question,
                answer: q.answer,
              }));
            }
            return [];
          } catch (err) {
            console.error(`Error processing slide`, err);
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
