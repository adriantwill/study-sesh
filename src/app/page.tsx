import AddFolder from "../components/AddFolder";
import FoldersList from "../components/FoldersList";
import NotesCard from "../components/NotesCard";
import UpcomingEventsCard from "../components/UpcomingEventsCard";
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
    <div className="h-dvh bg-background flex flex-col">
      <div className="h-full p-8 flex flex-col">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Study Sesh</h1>
        <p className="text-muted-foreground mb-8">
          Upload PowerPoint PDF to generate study questions
        </p>
        <div className="flex flex-1 min-h-0 gap-8">
          <div className="flex flex-col gap-8">
            <UpcomingEventsCard />
            <UpcomingEventsCard />
          </div>
          <div className="bg-muted rounded-lg shadow p-8 w-full flex flex-col gap-8 min-h-0 ">
            <UploadSwitcher />
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
          </div>
          <div className="flex flex-col gap-8">
            <UpcomingEventsCard />
            <NotesCard />
          </div>
        </div>
      </div>
    </div>
  );
}
