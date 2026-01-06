import UploadButton from "../components/UploadButton";
import { createClient } from "../lib/supabase/server";
import Link from "next/link";
import DeleteButton from "../components/DeleteButton";
import EditField from "../components/EditField";
import { Link as LinkIcon } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("uploads").select();

  if (error) {
    console.error("Error fetching uploads:", error);
    throw new Error("Failed to load uploads");
  }

  if (!data) {
    throw new Error("No data returned from database");
  }
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Study Sesh</h1>
        <p className="text-muted-foreground mb-8">
          Upload PowerPoint PDF to generate study questions
        </p>

        <div className="bg-muted rounded-lg shadow p-8">
          <UploadButton></UploadButton>
          <div className="mt-6 flex flex-col gap-4">
            {data.length > 0 && (
              <div>
                <h2 className="font-semibold mb-2 text-foreground">
                  Saved data:
                </h2>
                <ul className="space-y-1">
                  {data.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center"
                    >
                      <EditField
                        variant={"filename"}
                        textField={item.filename}
                        id={item.id}
                        completed={true}
                      />
                      <Link
                        className="hover:text-muted-foreground flex items-center justify-center"
                        href={`/review/${item.id}`}
                      >
                        <LinkIcon size={16} />
                      </Link>
                      <DeleteButton
                        id={item.id}
                        variant="upload"
                        completed={false}
                      />
                    </li>
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
