"use client";

import { useState } from "react";
import type { ParsedTableData } from "../lib/xlsx-table";
import MediumToolButton from "./MediumToolButton";

interface TableViewerProps {
	table: ParsedTableData;
}

const MERGED_WITH_ABOVE = "&^";

export default function TableViewer({ table }: TableViewerProps) {
	const toolOptions = [
		{
			label: "Blur All",
			onClick: () => setBlurredCells(new Set(allCellKeys)),
		},
		{
			label: "Unblur All",
			onClick: () => setBlurredCells(new Set()),
		},
	];

	const allCellKeys = table.rows.flatMap((_, rowIndex) =>
		table.headers.map((_header, headerIndex) => cellKey(rowIndex, headerIndex)),
	);
	const [blurredCells, setBlurredCells] = useState(() => new Set(allCellKeys));

	if (table.headers.length === 0) {
		return (
			<div className="rounded-sm border border-border bg-muted p-8 text-center text-muted-foreground">
				No table data found.
			</div>
		);
	}
	function toggleCell(key: string) {
		setBlurredCells((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}
	return (
		<div className="space-y-4">
			<div className="mb-4 flex gap-3">
				{toolOptions.map((option) => (
					<MediumToolButton key={option.label} options={option} />
				))}
			</div>
			<div className="overflow-x-auto rounded-sm border border-border bg-muted shadow-sm">
				<table className="min-w-full border-collapse">
					<thead>
						<tr className="bg-muted-hover">
							{table.headers.map((header) => (
								<th
									key={header}
									className="border-b border-border px-4 py-3 text-left font-semibold text-foreground"
								>
									{header}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{table.rows.map((row, rowIndex) => (
							<tr
								key={JSON.stringify(row)}
								className="border-b border-border/70 last:border-b-0"
							>
								{table.headers.map((header, headerIndex) => {
									const key = cellKey(rowIndex, headerIndex);
									const isBlurred = blurredCells.has(key);
									const rawValue = row[header] ?? "";
									if (rawValue.startsWith(MERGED_WITH_ABOVE)) return null;

									return (
										<td
											key={key}
											rowSpan={getRowSpan(table, rowIndex, header)}
											className="p-0 align-middle"
										>
											<button
												type="button"
												className={`min-h-20 w-full cursor-pointer px-4 py-3 text-left text-foreground transition-all duration-200 ${isBlurred ? "blur-sm" : ""}`}
												onClick={() => {
													toggleCell(key);
												}}
											>
												{rawValue}
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function cellKey(rowIndex: number, headerIndex: number) {
	return `${rowIndex}-${headerIndex}`;
}

function getRowSpan(table: ParsedTableData, rowIndex: number, header: string) {
	let rowSpan = 1;

	for (
		let nextRowIndex = rowIndex + 1;
		nextRowIndex < table.rows.length;
		nextRowIndex++
	) {
		if (!(table.rows[nextRowIndex][header] ?? "").startsWith(MERGED_WITH_ABOVE))
			break;
		rowSpan++;
	}

	return rowSpan;
}
