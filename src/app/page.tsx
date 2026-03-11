import AddFolder from "../components/AddFolder";
import FoldersList from "../components/FoldersList";

import UploadLink from "../components/UploadLink";
import UploadSwitcher from "../components/UploadSwitcher";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("uploads").select().order('filename');
  const { data: folders } = await supabase.from("folders").select().order('name');

  if (error) {
    console.error("Error fetching uploads:", error);
    throw new Error("Failed to load uploads");
  }

  if (!data) {
    throw new Error("No data returned from database");
  }

  return (
    <main>
      <section className="min-h-screen flex items-center flex-col justify-center bg-white">
        <div className="absolute top-8 text-center">
          <h1 className=" text-5xl font-bold mb-2 text-foreground">Study Sesh</h1>
          <p className=" text-muted-foreground mb-8 text-xl">
            Upload PowerPoint PDF to generate study questions
          </p>
        </div>
        <div className="flex flex-1 items-center min-h-0 gap-8">

          <div className="bg-muted rounded-lg shadow p-8 w-200 flex flex-col gap-8 min-h-0 ">
            <UploadSwitcher />

          </div>

        </div>
      </section>

      <section className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        {data.length > 0 && (
          <ul className="flex-1 min-h-0 overflow-y-auto px-4">
            <FoldersList folders={folders ?? []} uploads={data} />
            {data
              .filter((item) => item.folder_id === null)
              .map((item) => (
                <UploadLink
                  key={item.id}
                  upload={item}
                  folders={folders ?? []}
                />
              ))}

          </ul>
        )}
        <AddFolder />
      </section>
    </main>
    // <div className="h-dvh bg-background flex flex-col">
    //   <div className="h-full p-8 flex flex-col">

    //   </div>
    // </div>
  );
}
