import * as XLSX from "xlsx";

export interface TableCellData {
	value: string;
	rowspan?: number;
	skip?: boolean;
}

export interface ParsedTableData {
	headers: string[];
	rows: TableCellData[][];
}

function isTableCellData(value: unknown): value is TableCellData {
	if (typeof value !== "object" || value === null) return false;

	const cell = value as Partial<TableCellData>;
	return (
		typeof cell.value === "string" &&
		(cell.rowspan === undefined || typeof cell.rowspan === "number") &&
		(cell.skip === undefined || typeof cell.skip === "boolean")
	);
}

export function isParsedTableData(value: unknown): value is ParsedTableData {
	if (typeof value !== "object" || value === null) return false;

	const table = value as Partial<ParsedTableData>;
	return (
		Array.isArray(table.headers) &&
		table.headers.every((header) => typeof header === "string") &&
		Array.isArray(table.rows) &&
		table.rows.every(
			(row) => Array.isArray(row) && row.every(isTableCellData),
		)
	);
}

function hasCellValue(cell?: TableCellData) {
	return cell?.value !== undefined && cell.value !== null && cell.value !== "";
}

function trimTrailingEmptyColumnsAndRows(
	data: TableCellData[][],
): TableCellData[][] {
	if (data.length === 0) return data;

	let lastColWithData = data[0].length - 1;

	while (lastColWithData >= 0) {
		const hasDataInColumn = data.some((row) =>
			hasCellValue(row[lastColWithData]),
		);
		if (hasDataInColumn) break;
		lastColWithData--;
	}

	const trimmedCols = data.map((row) => row.slice(0, lastColWithData + 1));

	for (let i = trimmedCols.length - 1; i >= 0; i--) {
		if (!trimmedCols[i].some(hasCellValue)) trimmedCols.splice(i, 1);
	}

	return trimmedCols;
}

function processSheetWithMerges(worksheet: XLSX.WorkSheet): TableCellData[][] {
	const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
	const merges = worksheet["!merges"] || [];
	const data: TableCellData[][] = [];

	for (let row = range.s.r; row <= range.e.r; row++) {
		const rowData: TableCellData[] = [];

		for (let col = range.s.c; col <= range.e.c; col++) {
			const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
			const cell = worksheet[cellRef];

			rowData.push({
				value: cell ? String(cell.w ?? cell.v ?? "") : "",
				skip: false,
			});
		}

		data.push(rowData);
	}

	for (const merge of merges) {
		const startRow = merge.s.r - range.s.r;
		const endRow = merge.e.r - range.s.r;
		const col = merge.s.c - range.s.c;
		const rowspan = endRow - startRow + 1;

		if (data[startRow]?.[col]) {
			data[startRow][col].rowspan = rowspan;
		}

		for (let r = startRow + 1; r <= endRow; r++) {
			if (data[r]?.[col]) {
				data[r][col].skip = true;
			}
		}
	}

	return trimTrailingEmptyColumnsAndRows(data);
}

export function parseXlsxTable(arrayBuffer: ArrayBuffer): ParsedTableData {
	const workbook = XLSX.read(arrayBuffer, { type: "array" });
	const firstSheetName = workbook.SheetNames[0];

	if (!firstSheetName) {
		return { headers: [], rows: [] };
	}

	const worksheet = workbook.Sheets[firstSheetName];
	const tableData = processSheetWithMerges(worksheet);
	const headers = (tableData[0] ?? []).map((cell) => cell.value);
	const rows = tableData.slice(1);

	return { headers, rows };
}
