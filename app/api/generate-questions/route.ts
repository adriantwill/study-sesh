import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export interface StudyQuestion {
  question: string;
  answer: string;
  pageNumber: number;
  slideContext?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("png") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No PNG file provided" },
        { status: 400 },
      );
    }

    const questions: StudyQuestion[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Convert File to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const imageUrl = `data:${file.type};base64,${base64}`;

        // Use Qwen2-VL to analyze each slide and generate short-answer questions
        const response = await hf.chatCompletion({
          model: "Qwen/Qwen2-VL-7B-Instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
                {
                  type: "text",
                  text: `Analyze this educational slide and generate 2-3 short-answer study questions based on the key concepts.

Format your response as JSON array:
[
  {
    "question": "What is...",
    "answer": "Brief answer here",
    "slideContext": "Brief description of what the slide covers"
  }
]

Only return valid JSON, no additional text.`,
                },
              ],
            },
          ],
          max_tokens: 500,
        });

        const content = response.choices[0]?.message?.content || "";
        const jsonMatch = content.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const pageQuestions = JSON.parse(jsonMatch[0]);
          pageQuestions.forEach((q: any) => {
            questions.push({
              question: q.question,
              answer: q.answer,
              pageNumber: i + 1,
              slideContext: q.slideContext,
            });
          });
        }
      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
        // Continue with other pages
      }
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}
