import UploadButton from "../components/UploadButton";
import { createClient } from "../lib/supabase/server";
import Link from "next/link";
import DeleteButton from "../components/DeleteButton";
import EditField from "../components/EditField";
import { Link as LinkIcon } from "lucide-react";
import AddFolder from "../components/AddFolder";
import FoldersList from "../components/FoldersList";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("uploads").select()
  const { data: folders } = await supabase.from("folders").select();


  const foldersWithUploads = folders?.map(folder => ({
    ...folder,
    uploads: data?.filter(u => u.folder_id === folder.id) || []
  })) || [];


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
                <h2 className="font-semibold text-lg  text-foreground">
                  Saved data:
                </h2>
                <ul className="space-y-1 transition-transform duration-300">
                  <FoldersList foldersWithUploads={foldersWithUploads} />
                  {data.map((item) => (
                    <Link
                      href={`/review/${item.id}`}
                      key={item.id}
                      className="hover:text-muted-foreground flex justify-between items-center"
                    >
                      <EditField
                        variant={"filename"}
                        textField={item.filename}
                        id={item.id}
                        completed={false}
                      />
                      <DeleteButton
                        id={item.id}
                        variant="upload"
                        completed={false}
                      />
                    </Link>
                  ))}
                  <AddFolder />
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
