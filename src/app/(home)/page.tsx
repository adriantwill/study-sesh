import { asc, eq } from "drizzle-orm";
import { ArrowDown } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
	deadlines as deadlinesTable,
	folders as foldersTable,
	tableUploads,
	uploads,
} from "@/drizzle/schema";
import DueDatesPanel from "@/src/components/dashboard/DueDatesPanel";
import FoldersList from "@/src/components/dashboard/FoldersList";
import UploadSwitcher from "@/src/components/dashboard/UploadSwitcher";
import PomodoroTimer from "@/src/components/study/PomodoroTimer";
import BrandMark from "@/src/components/ui/BrandMark";
import { db } from "@/src/db";
import { auth } from "@/src/lib/auth";

export default async function Home() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	}
	const data = await db
		.select()
		.from(uploads)
		.where(eq(uploads.userId, session.user.id))
		.orderBy(asc(uploads.filename));
	const tables = await db
		.select()
		.from(tableUploads)
		.where(eq(tableUploads.userId, session.user.id))
		.orderBy(asc(tableUploads.filename));
	const folders = await db
		.select()
		.from(foldersTable)
		.where(eq(foldersTable.userId, session.user.id))
		.orderBy(asc(foldersTable.createdAt));
	const deadlines = await db
		.select()
		.from(deadlinesTable)
		.where(eq(deadlinesTable.userId, session.user.id))
		.orderBy(asc(deadlinesTable.dueDate), asc(deadlinesTable.createdAt));

	return (
		<main>
			<section className="flex min-h-dvh flex-col items-center p-6">
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
			<section className="relative grid min-h-dvh w-full grid-cols-1 gap-6 p-6 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch lg:p-8">
				<DueDatesPanel side="left" deadlines={deadlines} />
				<FoldersList folders={folders} uploads={data} tables={tables} />
				<PomodoroTimer />
			</section>
		</main>
	);
}
