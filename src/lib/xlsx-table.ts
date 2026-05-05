import * as XLSX from "xlsx";

const MERGED_WITH_ABOVE = "&^";

export interface ParsedTableData {
	headers: string[];
	rows: Record<string, string>[];
}

function cellText(sheet: XLSX.WorkSheet, row: number, col: number) {
	const cell = sheet[XLSX.utils.encode_cell({ r: row, c: col })];
	return cell == null ? "" : String(cell.w ?? cell.v ?? "");
}

function mergedWithAboveValue(sheet: XLSX.WorkSheet, row: number, col: number) {
	for (const merge of sheet["!merges"] ?? []) {
		const inMerge =
			row >= merge.s.r &&
			row <= merge.e.r &&
			col >= merge.s.c &&
			col <= merge.e.c;

		if (inMerge && row > merge.s.r) {
			return `${MERGED_WITH_ABOVE}${cellText(sheet, merge.s.r, merge.s.c)}`;
		}
	}

	return null;
}

export function parseXlsxTable(data: ArrayBuffer): ParsedTableData {
	const workbook = XLSX.read(data);
	const sheetName = workbook.SheetNames[0];
	const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;

	if (!sheet) return { headers: [], rows: [] };

	const nonEmptyCells = Object.keys(sheet)
		.filter((key) => !key.startsWith("!"))
		.map((key) => ({
			position: XLSX.utils.decode_cell(key),
			value: String(sheet[key]?.w ?? sheet[key]?.v ?? "").trim(),
		}))
		.filter((cell) => cell.value !== "");

	if (nonEmptyCells.length === 0) return { headers: [], rows: [] };

	const headerRow = Math.min(...nonEmptyCells.map((cell) => cell.position.r));
	const columns = nonEmptyCells
		.filter((cell) => cell.position.r === headerRow)
		.map((cell) => cell.position.c)
		.sort((a, b) => a - b);
	const bodyRows = Array.from(
		new Set(
			nonEmptyCells
				.map((cell) => cell.position.r)
				.filter((row) => row > headerRow),
		),
	).sort((a, b) => a - b);

	const headers: string[] = [];
	for (const col of columns) {
		headers.push(cellText(sheet, headerRow, col));
	}

	const rows: Record<string, string>[] = [];
	for (const row of bodyRows) {
		const parsedRow: Record<string, string> = {};

		for (const [columnIndex, col] of columns.entries()) {
			const header = headers[columnIndex];
			parsedRow[header] =
				mergedWithAboveValue(sheet, row, col) ?? cellText(sheet, row, col);
		}

		if (Object.values(parsedRow).some((value) => value.trim() !== "")) {
			rows.push(parsedRow);
		}
	}

	return { headers, rows };
}

export function isParsedTableData(value: unknown): value is ParsedTableData {
	return (
		typeof value === "object" &&
		value !== null &&
		Array.isArray((value as ParsedTableData).headers) &&
		Array.isArray((value as ParsedTableData).rows)
	);
}
