import Link from "next/link";
import BrandMark from "../../../components/BrandMark";
import TableViewer from "../../../components/TableViewer";
import { createClient } from "../../../lib/supabase/server";
import { isParsedTableData } from "../../../lib/xlsx-table";

export default async function TablePage({
	params,
}: {
	params: Promise<{ tableId: string }>;
}) {
	const { tableId } = await params;
	const supabase = await createClient();

	const { data: tableUpload, error } = await supabase
		.from("table_uploads")
		.select("filename, parsed_data")
		.eq("id", tableId)
		.single();

	if (error || !tableUpload) {
		console.error("Error fetching table upload:", error);
		throw new Error("Failed to load table");
	}

	if (!isParsedTableData(tableUpload.parsed_data)) {
		throw new Error("No parsed table data found");
	}

	return (
		<div className="min-h-screen bg-background p-8">
			<div className="mx-auto max-w-6xl space-y-8">
				<h1 className="flex min-w-0 items-center gap-3 text-3xl font-bold text-foreground">
					<Link href="/" aria-label="Go to home page">
						<BrandMark size={32} />
					</Link>
					<span className="min-w-0 truncate">{tableUpload.filename}</span>
				</h1>
				<TableViewer table={tableUpload.parsed_data} />
			</div>
		</div>
	);
}
