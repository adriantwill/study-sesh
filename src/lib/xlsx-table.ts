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
	const range = sheet?.["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;

	if (!sheet || !range) return { headers: [], rows: [] };

	const headers: string[] = [];
	for (let col = range.s.c; col <= range.e.c; col++) {
		headers.push(cellText(sheet, range.s.r, col));
	}

	const rows: Record<string, string>[] = [];
	for (let row = range.s.r + 1; row <= range.e.r; row++) {
		const parsedRow: Record<string, string> = {};

		for (let col = range.s.c; col <= range.e.c; col++) {
			const header = headers[col - range.s.c];
			parsedRow[header] =
				mergedWithAboveValue(sheet, row, col) ?? cellText(sheet, row, col);
		}

		rows.push(parsedRow);
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
