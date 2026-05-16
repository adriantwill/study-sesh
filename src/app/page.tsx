import { ArrowDown } from "lucide-react";
import { headers } from "next/headers";
import BrandMark from "../components/BrandMark";
import FoldersList from "../components/FoldersList";
import UploadSwitcher from "../components/UploadSwitcher";
import { auth } from "../lib/auth";
import { createClient } from "../lib/supabase/server";

export default async function Home() {
	const supabase = await createClient();
	const session = await auth.api.getSession({ headers: await headers() });
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
			<section className="flex min-h-dvh flex-col items-center p-8">
				<h1 className="flex justify-center gap-3 text-[clamp(2.25rem,8vw,3rem)] font-bold text-foreground">
					<span>Study Sesh</span>
					<BrandMark size={54} className="translate-y-0.5" />
				</h1>
				<div className="flex flex-1 items-center">
					<UploadSwitcher />
				</div>
				<ArrowDown />
			</section>
			<hr className="border-border" />
			<section className="flex h-dvh flex-col items-center p-8">
				<FoldersList folders={folders ?? []} uploads={data} tables={tables} />
			</section>
		</main>
	);
}
