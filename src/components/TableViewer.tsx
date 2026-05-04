"use client";

import { useState } from "react";
import type { ParsedTableData } from "../lib/xlsx-table";

interface TableViewerProps {
	table: ParsedTableData;
}

const MERGED_WITH_ABOVE = "&^";

export default function TableViewer({ table }: TableViewerProps) {
	const allCellKeys = Array.from({ length: table.rows.length }, (_, rowIndex) =>
		Array.from({ length: table.headers.length }, (_, headerIndex) =>
			cellKey(rowIndex, headerIndex),
		),
	).flat();
	const [blurredCells, setBlurredCells] = useState<Set<string>>(
		() => new Set(allCellKeys),
	);

	function toggleCell(key: string) {
		setBlurredCells((current) => {
			const next = new Set(current);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	if (table.headers.length === 0) {
		return (
			<div className="rounded-sm border border-border bg-muted p-8 text-center text-muted-foreground">
				No table data found.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<button
					type="button"
					onClick={() => setBlurredCells(new Set(allCellKeys))}
					className="rounded-sm border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted-hover"
				>
					Blur All
				</button>
				<button
					type="button"
					onClick={() => setBlurredCells(new Set())}
					className="rounded-sm border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted-hover"
				>
					Unblur All
				</button>
			</div>

			<div className="overflow-x-auto rounded-sm border border-border bg-muted shadow-sm">
				<table className="min-w-full border-collapse">
					<thead>
						<tr className="bg-muted-hover">
							{table.headers.map((header, headerIndex) => (
								<th
									key={headerKey(header, headerIndex)}
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
								key={rowKey(row, rowIndex)}
								className="border-b border-border/70 last:border-b-0"
							>
								{table.headers.map((header, headerIndex) => {
									const key = cellKey(rowIndex, headerIndex);
									const isBlurred = blurredCells.has(key);
									const value = displayValue(row[header] ?? "");

									return (
										<td
											key={cellKey(rowIndex, headerIndex)}
											onClick={() => toggleCell(key)}
											onKeyDown={(event) => {
												if (event.key === "Enter" || event.key === " ") {
													event.preventDefault();
													toggleCell(key);
												}
											}}
											role="button"
											tabIndex={0}
											className={`h-20 cursor-pointer px-4 py-3 align-middle text-foreground transition-all duration-200 ${isBlurred ? "blur-sm" : ""}`}
										>
											{value}
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

function displayValue(value: string) {
	return value.startsWith(MERGED_WITH_ABOVE)
		? value.slice(MERGED_WITH_ABOVE.length)
		: value;
}

function headerKey(header: string, headerIndex: number) {
	return header || `column-${headerIndex}`;
}

function rowKey(row: Record<string, string>, rowIndex: number) {
	return JSON.stringify(row) || `row-${rowIndex}`;
}
