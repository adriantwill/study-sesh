import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { tableUploads } from "@/drizzle/schema";
import EditTitle from "@/src/components/questions/EditTitle";
import TableViewer from "@/src/components/tables/TableViewer";
import { db } from "@/src/db";
import { auth } from "@/src/lib/auth";
import { isParsedTableData } from "@/src/lib/xlsx-table";

export default async function TablePage({
	params,
}: {
	params: Promise<{ tableId: string }>;
}) {
	const { tableId } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	}
	const [ownedTable] = await db
		.select({ id: tableUploads.id })
		.from(tableUploads)
		.where(
			and(
				eq(tableUploads.id, tableId),
				eq(tableUploads.userId, session.user.id),
			),
		)
		.limit(1);
	if (!ownedTable) {
		redirect("/");
	}

	const [tableUpload] = await db
		.select({
			filename: tableUploads.filename,
			parsedData: tableUploads.parsedData,
		})
		.from(tableUploads)
		.where(eq(tableUploads.id, tableId))
		.limit(1);

	if (!tableUpload) throw new Error("Failed to load table");

	if (!isParsedTableData(tableUpload.parsedData)) {
		throw new Error("No parsed table data found");
	}

	return (
		<div className="mx-auto min-h-dvh max-w-6xl space-y-8 p-8">
			<div className="flex min-w-0">
				<EditTitle title={tableUpload.filename} reviewId={tableId} />
			</div>
			<TableViewer table={tableUpload.parsedData} />
		</div>
	);
}
