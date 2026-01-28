import { StudyQuestion } from "@/src/types";
import { Poppler } from "node-poppler";
import path from "path";
import fs from "fs/promises";

//TODO optimize the pdf cario thing
export async function generateQuestions(file: File): Promise<StudyQuestion[]> {
  // MOCK MODE: Return dummy data if MOCK_AI is set
  if (process.env.MOCK_AI === "true") {
    console.log("MOCK_AI enabled: Returning dummy questions");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    const mockQuestions: StudyQuestion[] = [
      {
        id: "mock-1",
        question: "The capital of France",
        answer: "Paris",
      },
      {
        id: "mock-2",
        question: "The powerhouse of the cell",
        answer: "Mitochondria",
      },
      {
        id: "mock-3",
        question: "Concept of photosynthesis",
        answer:
          "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.",
      },
      {
        id: "mock-4",
        question: "Author of 'To Kill a Mockingbird'",
        answer: "Harper Lee",
      },
    ];
    return mockQuestions;
  }

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
      (f) => f.startsWith(`slides-${fileId}`) && f.endsWith(".png")
    );

    const processPagePromises = imageFiles.map(async (fileName) => {
      const pageNumber = parseInt(fileName.match(/-(\d+)\.png$/)?.[1] || "0");
      const imagePath = path.join(tempDir, fileName);

      try {
        const imageBuffer = await fs.readFile(imagePath);
        const base64Img = imageBuffer.toString("base64");
        const imageUrl = `data:image/png;base64,${base64Img}`;

        // Clean up image immediately after reading
        await fs.unlink(imagePath).catch(() => { });
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

Skip if the slide has no testable content (title slides, "questions?" slides, images without text).

Format as JSON array:
[
  {
    "question": "Question here",
    "answer": "Concise answer (1-2 sentences max)"
  }
]

Rules:
- Only return valid JSON, no additional text
- Return empty array [] if no testable content
- Do not reiterate the question in the answer`,
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
            completed: false,
            pageNumber,
          }));
        }
        return [];
      } catch (err) {
        console.error(`Error processing slide`, err);
        return [];
      }
    });

    const results = await Promise.all(processPagePromises);
    return results.flat();
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
