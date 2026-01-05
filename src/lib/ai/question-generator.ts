import { StudyQuestion } from "@/src/types";
import { Poppler } from "node-poppler";
import path from "path";
import fs from "fs/promises";
import os from "os";

export async function generateQuestions(file: File): Promise<StudyQuestion[]> {
  // MOCK MODE: Return dummy data if MOCK_AI is set
  if (process.env.MOCK_AI === "true") {
    console.log("MOCK_AI enabled: Returning dummy questions");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    const mockQuestions: StudyQuestion[] = [
      {
        id: "mock-1",
        question: "What is the capital of France?",
        answer: "Paris",
        pageNumber: 1,
        completed: false,
      },
      {
        id: "mock-2",
        question: "What is the powerhouse of the cell?",
        answer: "Mitochondria",
        pageNumber: 1,
        completed: false,
      },
      {
        id: "mock-3",
        question: "Explain the concept of photosynthesis.",
        answer:
          "Photosynthesis is the process by which green plants use sunlight to synthesize foods from carbon dioxide and water.",
        pageNumber: 2,
        completed: false,
      },
      {
        id: "mock-4",
        question: "Who wrote 'To Kill a Mockingbird'?",
        answer: "Harper Lee",
        pageNumber: 3,
        completed: false,
      },
    ];
    return mockQuestions;
  }

  if (!process.env.HYPERBOLIC_API_KEY) {
    throw new Error("HYPERBOLIC_API_KEY not configured");
  }

  // Generate a unique temporary file path
  const tempDir = os.tmpdir();
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
    
    // Get PDF Info to check page count
    const pdfInfo = await poppler.pdfInfo(pdfPath);
    // pdfInfo returns an object with 'pages' property (number)
    // @ts-ignore - node-poppler types might be incomplete
    const pageCount = parseInt(pdfInfo.pages, 10);
    
    if (isNaN(pageCount)) {
       throw new Error("Could not determine page count from PDF");
    }

    console.log(`PDF parsed successfully. Pages: ${pageCount}`);

    if (pageCount > 70) {
      throw new Error("PDF file too large (max 70 pages)");
    }

    // Convert PDF to PNGs using pdftocairo
    // We want to skip the first 2 pages, so we start converting from page 3.
    // pdftocairo options: -f (first page), -l (last page), -png
    
    const options = {
      firstPageToConvert: 3,
      pngFile: true,
      scaleTo: 1024, // Reasonable width for AI analysis
    };

    // Note: node-poppler's pdfToCairo might return a buffer if no output file is specified, 
    // but typically it writes to files with the prefix.
    // Documentation says: pdfToCairo(sourceFile, outputFile, options)
    // If we provide outputFile, it acts as a prefix.
    
    if (pageCount >= 3) {
      await poppler.pdfToCairo(pdfPath, outputPrefix, options);
    } else {
      console.log("PDF has fewer than 3 pages, skipping processing.");
      return [];
    }

    // Process each generated image
    // pdftocairo generates filenames like: prefix-1.png, prefix-2.png...
    // BUT the numbering corresponds to the page number if we are lucky, or index.
    // Let's check the generated files.
    // Actually, pdftocairo usually appends page number: prefix-03.png or similar depending on version.
    // To be safe, we can read the directory or predict filenames.
    // A simpler approach with node-poppler might be to convert page by page if batching is unpredictable,
    // but batch is faster. 
    // Standard pdftocairo output format is: {prefix}-{page}.png (or .jpg)
    // e.g. slides-abc-3.png, slides-abc-4.png

    const questions: StudyQuestion[] = [];
    
    // Create an array of page numbers to process
    const pagesToProcess = [];
    for (let i = 3; i <= pageCount; i++) {
        pagesToProcess.push(i);
    }

    const processPagePromises = pagesToProcess.map(async (pageNumber) => {
        // Construct expected filename. 
        // pdftocairo often pads numbers, e.g. -03.png or -3.png. 
        // It's safest to look for the file.
        // Let's try standard patterns.
        
        let imagePath = `${outputPrefix}-${pageNumber}.png`;
        // Check if file exists, if not try padded version (unlikely with default settings but possible)
        try {
            await fs.access(imagePath);
        } catch {
             // Try padded with leading zero
             imagePath = `${outputPrefix}-${String(pageNumber).padStart(2, '0')}.png`;
             try {
                 await fs.access(imagePath);
             } catch {
                 // Try padded with two leading zeros
                  imagePath = `${outputPrefix}-${String(pageNumber).padStart(3, '0')}.png`;
                  try {
                       await fs.access(imagePath);
                  } catch {
                       console.error(`Could not find generated image for page ${pageNumber}`);
                       return [];
                  }
             }
        }
        
        try {
            const imageBuffer = await fs.readFile(imagePath);
            const base64Img = imageBuffer.toString("base64");
            const imageUrl = `data:image/png;base64,${base64Img}`;

            // Clean up image immediately after reading
            await fs.unlink(imagePath).catch(() => {});

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
                            text: `Analyze this educational slide and generate 2-3 short-answer study questions based on the key concepts.

Format your response as JSON array:
[
{
    "question": "What is...",
    "answer": "Brief answer here",
}
]

Only return valid JSON, no additional text.`,
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
            console.log(`Hyperbolic API response received for page ${pageNumber}`);

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
                    pageNumber: pageNumber,
                    completed: false,
                }));
            }
             return [];

        } catch (err) {
            console.error(`Error processing page ${pageNumber}`, err);
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
          await fs.unlink(pdfPath).catch(() => {});
          // Try to cleanup any remaining images
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
