import { NextRequest, NextResponse } from "next/server";
import { InferenceClient } from "@huggingface/inference";
import parseAPNG from "apng-js";

export interface StudyQuestion {
  question: string;
  answer: string;
  pageNumber: number;
  slideContext?: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log("API route called");
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error("Missing HUGGINGFACE_API_KEY");
      return NextResponse.json(
        { error: "HUGGINGFACE_API_KEY not configured" },
        { status: 500 },
      );
    }
    console.log(
      "API key present, length:",
      process.env.HUGGINGFACE_API_KEY.length,
    );

    const hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

    const formData = await req.formData();
    const file = formData.get("png") as File;
    const arrayBuffer = await file.arrayBuffer();
    const apng = parseAPNG(arrayBuffer);
    if (apng instanceof Error) {
      console.error("Not APNG");
      return NextResponse.json(
        { error: "No PNG/APNG file provided" },
        { status: 400 },
      );
    }
    if (!file) {
      return NextResponse.json(
        { error: "No PNG/APNG file provided" },
        { status: 400 },
      );
    }
    const files = apng.frames;
    const questions: StudyQuestion[] = [];
    let page = 0;
    for (const frame of files) {
      if (page > 2) {
        console.log("Reached maximum pages");
        break;
      }
      if (page < 0) {
        page++;
        continue;
      }
      try {
        if (!frame.imageData) {
          console.error("No imageData for frame");
          continue;
        }
        const arrayBuffer = await frame.imageData.arrayBuffer();

        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const imageUrl = `data:${file.type};base64,${base64}`;

        // Use Qwen2-VL to analyze each slide and generate short-answer questions
        let response;
        try {
          response = await hf.chatCompletion({
            model: "Qwen/Qwen2.5-VL-7B-Instruct",
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
        } catch (hfError: any) {
          console.error(`HuggingFace API error:`, hfError);
          console.error(`Error status: ${hfError?.status || "unknown"}`);
          console.error(`Error message: ${hfError?.message || "unknown"}`);
          console.error(`Full error object:`, JSON.stringify(hfError, null, 2));

          // Return error to frontend for debugging
          return NextResponse.json(
            {
              error: "HuggingFace API error",
              details: hfError?.message || "Unknown error",
              status: hfError?.status || "unknown",
            },
            { status: 503 },
          );
        }

        console.log(`HF API response received for page ${page}`);
        const content = response.choices[0]?.message?.content || "";
        console.log(`Response content length: ${content.length}`);

        const jsonMatch = content.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const pageQuestions = JSON.parse(jsonMatch[0]) as Array<{
            question: string;
            answer: string;
            slideContext?: string;
          }>;

          pageQuestions.forEach((q) => {
            questions.push({
              question: q.question,
              answer: q.answer,
              pageNumber: page + 1,
              slideContext: q.slideContext,
            });
          });
        } else {
          console.log(`No JSON match found in response for file`);
        }
        page++;
      } catch (error) {
        console.error(`Error processing a frame:`, error);
        if (error instanceof Error) {
          console.error(`Error details: ${error.message}`);
        }
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
