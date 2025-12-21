import UploadButton from "../components/UploadButton";
import { createClient } from "../lib/supabase/client";
import Link from "next/link";
import DeleteButton from "../components/DeleteButton";

export default async function Home() {
  const supabase = createClient();
  const { data, error } = await supabase.from("uploads").select();
  console.log(error);
  if (error || !data) {
    console.error("Error fetching uploads, using dummy data:", error);
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Study Sesh</h1>
        <p className="text-muted-foreground mb-8">
          Upload PowerPoint png to generate study questions
        </p>

        <div className="bg-muted rounded-lg shadow p-8">
          <UploadButton></UploadButton>
          <div className="mt-6">
            {data.length > 0 && (
              <div>
                <h2 className="font-semibold mb-2 text-foreground">
                  Saved data:
                </h2>
                <ul className="space-y-1">
                  {data.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <Link
                        className=" text-muted-foreground  hover:text-foreground"
                        href={`/review/${item.id}`}
                      >
                        {item.filename}
                      </Link>
                      <DeleteButton id={item.id} variant={"upload"} />
                    </div>
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
