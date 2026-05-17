import { ArrowDown } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import BrandMark from "../components/BrandMark";
import DueDatesPanel from "../components/DueDatesPanel";
import FoldersList from "../components/FoldersList";
import UploadSwitcher from "../components/UploadSwitcher";
import { auth } from "../lib/auth";
import { createClient } from "../lib/supabase/server";

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
					<span>{session.user.name}'s Study Sesh</span>
					<BrandMark size={54} className="translate-y-0.5" />
				</h1>
				<div className="flex flex-1 items-center">
					<UploadSwitcher />
				</div>
				<ArrowDown />
			</section>
			<hr className="border-border" />
			<section className="relative grid min-h-dvh w-full grid-cols-1 gap-6 p-6 lg:h-dvh lg:grid-cols-[minmax(13rem,1fr)_minmax(0,40rem)_minmax(13rem,1fr)] lg:items-center lg:p-8">
				<div className="order-2 lg:order-1">
					<DueDatesPanel side="left" />
				</div>
				<div className="order-1 flex min-h-0 w-full flex-col items-center lg:order-2 lg:h-[calc(100dvh-4rem)]">
					<FoldersList folders={folders ?? []} uploads={data} tables={tables} />
				</div>
			</section>
		</main>
	);
}
