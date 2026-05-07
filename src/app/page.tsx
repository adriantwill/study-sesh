import { ArrowDown } from "lucide-react";

import BrandMark from "../components/BrandMark";
import FoldersList from "../components/FoldersList";
import UploadSwitcher from "../components/UploadSwitcher";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("uploads")
		.select()
		.order("filename");
	const { data: tables, error: tablesError } = await supabase
		.from("table_uploads")
		.select()
		.order("filename");
	const { data: folders } = await supabase
		.from("folders")
		.select()
		.order("created_at");

	if (error) {
		console.error("Error fetching uploads:", error);
		throw new Error("Failed to load uploads");
	}

	if (tablesError) {
		console.error("Error fetching tables:", tablesError);
		throw new Error("Failed to load tables");
	}

	if (!data || !tables || !folders) {
		throw new Error("No data returned from database");
	}

	return (
		<main>
			<section className="min-h-screen flex items-center flex-col justify-center ">
				<div className="absolute top-8 text-center space-y-4">
					<h1 className="flex items-center justify-center gap-3 text-5xl font-bold text-foreground">
						<span>Study Sesh</span>
						<BrandMark size={54} className="translate-y-0.5" />
					</h1>
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
					<FoldersList folders={folders ?? []} uploads={data} tables={tables} />
				</div>
			</section>
		</main>
	);
}
