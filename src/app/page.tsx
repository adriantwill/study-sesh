// import { Tables } from "@/database.types";
import UploadButton from "../components/UploadButton";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.from("uploads").select();

  if (error || !data) {
    console.error("Error fetching uploads, using dummy data:", error);
    return null;
    /*
    data = [
      {
        id: "dummy-1",
        filename: "Dummy Upload 1.png",
        page_count: 3,
        created_at: new Date().toISOString(),
      } as Tables<"uploads">,
      {
        id: "dummy-2",
        filename: "Dummy Upload 2.png",
        page_count: 2,
        created_at: new Date().toISOString(),
      } as Tables<"uploads">,
    ];
     */
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">
          Study Sesh
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Upload PowerPoint png to generate study questions
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8">
          <UploadButton></UploadButton>
          <div className="mt-6">
            {data.length > 0 && (
              <div>
                <h2 className="font-semibold mb-2 text-black dark:text-white">
                  Saved data:
                </h2>
                <ul className="space-y-1">
                  {data.map((item, index) => (
                    <Link
                      className="block text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer hover:text-black dark:hover:text-white"
                      key={index}
                      href={`/review/${item.id}`}
                    >
                      {item.filename}
                    </Link>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
