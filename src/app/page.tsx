import { ArrowDown } from "lucide-react";
import AddFolder from "../components/AddFolder";
import FoldersList from "../components/FoldersList";
import UploadSwitcher from "../components/UploadSwitcher";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("uploads").select().order('filename');
  const { data: folders } = await supabase.from("folders").select().order('created_at');

  if (error) {
    console.error("Error fetching uploads:", error);
    throw new Error("Failed to load uploads");
  }

  if (!data) {
    throw new Error("No data returned from database");
  }

  return (
    <main>
      <section className="min-h-screen flex items-center flex-col justify-center ">
        <div className="absolute top-8 text-center space-y-4">
          <h1 className=" text-5xl font-bold text-foreground">Study Sesh</h1>
          <p className=" text-muted-foreground text-xl">
            Upload PowerPoint PDF to generate study questions
          </p>
        </div>
        <UploadSwitcher />
        <ArrowDown className="absolute bottom-8" />
      </section>
      <hr className="border-border" />
      <section className="min-h-screen max-h-screen flex flex-col p-8 items-center">
        <div className="gap-8 h-screen min-h-0 flex flex-col">
          <h2 className="text-3xl font-bold ">Your Tools</h2>
          <div className="bg-muted flex flex-1 min-h-0 flex-col rounded-sm shadow w-200">
            {data.length > 0 && (
              <ul className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
                <FoldersList folders={folders ?? []} uploads={data} />
              </ul>
            )}
            <div className="px-8 pb-6">
              <AddFolder />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
