import { ArrowDown, LogOutIcon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import BrandMark from "../components/BrandMark";
import FoldersList from "../components/FoldersList";
import UploadSwitcher from "../components/UploadSwitcher";
import { auth } from "../lib/auth";
import { createClient } from "../lib/supabase/server";
import { signOutAction } from "./actions/auth";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	}
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("uploads")
		.select()
		.eq("user_id", session.user.id)
		.order("filename");
	const { data: tables, error: tablesError } = await supabase
		.from("table_uploads")
		.select()
		.eq("user_id", session.user.id)
		.order("filename");
	const { data: folders } = await supabase
		.from("folders")
		.select()
		.eq("user_id", session.user.id)
		.order("created_at");

	if (error) {
		console.error("Error fetching uploads:", error);
		throw new Error("Failed to load uploads");
	}

	if (tablesError) {
		console.error("Error fetching tables:", tablesError);
		throw new Error("Failed to load tables");
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
			<section className="flex h-dvh flex-col items-center p-8 relative">
				<FoldersList folders={folders ?? []} uploads={data} tables={tables} />
			</section>
		</main>
	);
}
