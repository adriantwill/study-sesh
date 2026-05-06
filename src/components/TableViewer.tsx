"use client";

import { useState } from "react";
import type { ParsedTableData } from "../lib/xlsx-table";

interface TableViewerProps {
  table: ParsedTableData;
}

const MERGED_WITH_ABOVE = "&^";

export default function TableViewer({ table }: TableViewerProps) {
  const allCellKeys = table.rows.flatMap((row, rowIndex) =>
    table.headers.map((header, headerIndex) => cellKey(rowIndex, headerIndex)),
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
                  key={`${header}-${headerIndex}`}
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
                {table.headers.map((header, headerIndex) => {
                  const key = cellKey(rowIndex, headerIndex);
                  const isBlurred = blurredCells.has(key);
                  const rawValue = row[header] ?? "";
                  if (rawValue.startsWith(MERGED_WITH_ABOVE)) return null;
                  const value =
                    rawValue.startsWith(MERGED_WITH_ABOVE)
                      ? rawValue.slice(MERGED_WITH_ABOVE.length)
                      : rawValue;


                  return (
                    <td
                      key={key}
                      rowSpan={getRowSpan(table, rowIndex, header)}
                      className={`h-20 cursor-pointer px-4 py-3 align-middle text-foreground transition-all duration-200 ${isBlurred ? "blur-sm" : ""}`}
                      onClick={() => {
                        toggleCell(key);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleCell(key);
                        }
                      }}
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

function getRowSpan(table: ParsedTableData, rowIndex: number, header: string) {
  let rowSpan = 1;

  for (let nextRowIndex = rowIndex + 1; nextRowIndex < table.rows.length; nextRowIndex++) {
    if (!(table.rows[nextRowIndex][header] ?? "").startsWith(MERGED_WITH_ABOVE)) break;
    rowSpan++;
  }

  return rowSpan;
}
