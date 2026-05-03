"use client";

import { useMemo, useState } from "react";
import type { ParsedTableData } from "../lib/xlsx-table";

interface TableViewerProps {
	table: ParsedTableData;
}

function cellKey(rowIndex: number, colIndex: number) {
	return `${rowIndex}-${colIndex}`;
}

export default function TableViewer({ table }: TableViewerProps) {
	const [blurredCells, setBlurredCells] = useState<Set<string>>(() => {
		const initialBlurredCells = new Set<string>();

		for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
			for (let colIndex = 1; colIndex < table.headers.length; colIndex++) {
				if (!table.rows[rowIndex][colIndex]?.skip) {
					initialBlurredCells.add(cellKey(rowIndex, colIndex));
				}
			}
		}

		return initialBlurredCells;
	});

	const allCellKeys = useMemo(() => {
		const keys = new Set<string>();

		for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
			for (let colIndex = 0; colIndex < table.headers.length; colIndex++) {
				if (!table.rows[rowIndex][colIndex]?.skip) {
					keys.add(cellKey(rowIndex, colIndex));
				}
			}
		}

		return keys;
	}, [table]);

	function toggleCell(rowIndex: number, colIndex: number) {
		const key = cellKey(rowIndex, colIndex);

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
					onClick={() => setBlurredCells(allCellKeys)}
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
							{table.headers.map((header, index) => (
								<th
									key={`${header}-${index}`}
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
								key={rowIndex}
								className="border-b border-border/70 last:border-b-0"
							>
								{row.map((cell, colIndex) => {
									if (cell.skip) return null;

									const key = cellKey(rowIndex, colIndex);
									const isBlurred = blurredCells.has(key);

									return (
										<td
											key={key}
											rowSpan={cell.rowspan || 1}
											onClick={() => toggleCell(rowIndex, colIndex)}
											className={`h-20 cursor-pointer px-4 py-3 align-middle text-foreground transition-all duration-200 ${isBlurred ? "blur-sm" : ""}`}
										>
											{cell.value}
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
