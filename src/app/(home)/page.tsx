import { ArrowDown } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DueDatesPanel from "@/src/components/dashboard/DueDatesPanel";
import FoldersList from "@/src/components/dashboard/FoldersList";
import UploadSwitcher from "@/src/components/dashboard/UploadSwitcher";
import PomodoroTimer from "@/src/components/study/PomodoroTimer";
import BrandMark from "@/src/components/ui/BrandMark";
import { auth } from "@/src/lib/auth";
import { createClient } from "@/src/lib/supabase/server";

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
	const { data: deadlines, error: deadlinesError } = await supabase
		.from("deadlines")
		.select()
		.eq("user_id", session.user.id)
		.order("due_date", { ascending: true, nullsFirst: false })
		.order("created_at");

	if (error) {
		console.error("Error fetching uploads:", error);
		throw new Error("Failed to load uploads");
	}

	if (tablesError) {
		console.error("Error fetching tables:", tablesError);
		throw new Error("Failed to load tables");
	}

	if (deadlinesError) {
		console.error("Error fetching deadlines:", deadlinesError);
		throw new Error("Failed to load deadlines");
	}

	return (
		<main>
			<section className="flex min-h-dvh flex-col items-center p-6">
				<h1 className="flex justify-center gap-3 text-[clamp(2.25rem,8vw,3rem)] font-bold text-foreground">
					<span>{session.user.name}'s' Study Sesh</span>
					<BrandMark size={54} className="translate-y-0.5" />
				</h1>
				<div className="flex flex-1 items-center">
					<UploadSwitcher />
				</div>
				<ArrowDown />
			</section>
			<hr className="border-border" />
			<section className="relative grid min-h-dvh w-full grid-cols-1 gap-6 p-6 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch lg:p-8">
				<DueDatesPanel side="left" deadlines={deadlines ?? []} />
				<FoldersList folders={folders ?? []} uploads={data} tables={tables} />
				<PomodoroTimer />
			</section>
		</main>
	);
}
