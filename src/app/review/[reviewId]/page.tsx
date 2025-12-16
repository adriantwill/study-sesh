"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudyQuestion } from "../../api/generate-questions/route";
import { createClient } from "../../../lib/supabase/client";
import ReviewMode from "../../../components/ReviewComponents";

export default function ReviewPage({
  params,
}: {
  params: { reviewId: string };
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      const supabase = createClient();
      const { data: questionData, error } = await supabase
        .from("questions")
        .select("*")
        .eq("upload_id", params.reviewId);

      if (error) {
        console.error("Error fetching questions:", error);
        router.push("/");
        return;
      }

      const formattedQuestions: StudyQuestion[] = questionData.map((q) => ({
        question: q.question_text,
        answer: q.answer_text,
        pageNumber: q.page_number,
        slideContext: q.context,
      }));

      setQuestions(formattedQuestions);
      setLoading(false);
    };

    fetchQuestions();
  }, [params.reviewId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return <ReviewMode questions={questions} onReset={() => router.push("/")} />;
}
