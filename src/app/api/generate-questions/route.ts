import { NextRequest, NextResponse } from "next/server";
import { StudyQuestion } from "@/src/types";
import { PDFParse } from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    console.log("API route called");
    if (!process.env.HYPERBOLIC_API_KEY) {
      console.error("Missing HYPERBOLIC_API_KEY");
      return NextResponse.json(
        { error: "HYPERBOLIC_API_KEY not configured" },
        { status: 500 },
      );
    }
    console.log(
      "API key present, length:",
      process.env.HYPERBOLIC_API_KEY.length,
    );

    const formData = await req.formData();
    const file = formData.get("pdf") as File;
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({
      data: arrayBuffer,
    });

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 },
      );
    }

    const result = await parser.getScreenshot();
    await parser.destroy();

    const framePromises = result.pages.map(async (frame, index) => {
      if (index < 2) {
        return null;
      }
      if (result.pages.length > 70) {
        return NextResponse.json(
          { error: "PDF file too large" },
          { status: 400 },
        );
      }

      try {
        if (!frame.data) {
          console.error(`No imageData for frame ${index}`);
          return null;
        }

        const base64 = Buffer.from(frame.data).toString("base64");
        const imageUrl = `data:${file.type};base64,${base64}`;

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
        console.log(`Hyperbolic API response received for page ${index + 1}`);

        const content = response.choices[0]?.message?.content || "";
        const jsonMatch = content.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const pageQuestions = JSON.parse(jsonMatch[0]) as Array<{
            question: string;
            answer: string;
          }>;

          return pageQuestions.map((q) => ({
            id: "id",
            question: q.question,
            answer: q.answer,
            pageNumber: index + 1,
            completed: false,
          }));
        }

        console.log(`No JSON match found in response for frame ${index}`);
        return null;
      } catch (error) {
        console.error(`Error processing frame ${index}:`, error);
        return null;
      }
    });

    const results = await Promise.all(framePromises);
    const questions: StudyQuestion[] = results
      .filter((result) => result !== null)
      .flat();

    return NextResponse.json(questions);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}
