import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EditTitle from "@/src/components/EditTitle";
import { auth } from "@/src/lib/auth";
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
	const { data: quizData, error: quizError } = await supabase
		.from("table_uploads")
		.select("user_id")
		.eq("id", tableId)
		.single();
	if (quizError) {
		console.error("Error fetching quiz:", quizError);
		throw new Error("Failed to load quiz");
	}
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		redirect("/signup");
	} else if (!quizData || quizData.user_id !== session.user.id) {
		redirect("/");
	}

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
		<div className="mx-auto min-h-dvh max-w-6xl space-y-8 p-8">
			<div className="flex min-w-0">
				<EditTitle title={tableUpload.filename} reviewId={tableId} />
			</div>
			<TableViewer table={tableUpload.parsed_data} />
		</div>
	);
}
