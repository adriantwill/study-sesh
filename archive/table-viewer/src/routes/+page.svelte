<script lang="ts">
    import * as XLSX from "xlsx";
    import { Trash, Pencil } from "lucide-svelte";

    interface CellData {
        value: string;
        rowspan?: number;
        skip?: boolean;
    }

    let result = $state<CellData[][]>([]);
    let headers = $state<string[]>([]);
    let blurred = $state(new Set<string>());
    let editingCell = $state<string | null>(null);

    function toggleReveal(i: number, j: number) {
        const key = `${i}-${j}`;
        const newblurred = new Set(blurred);
        if (newblurred.has(key)) {
            newblurred.delete(key);
        } else {
            newblurred.add(key);
        }
        blurred = newblurred;
    }

    function unblurAll() {
        blurred = new Set();
    }

    function blurAll() {
        const newblurred = new Set<string>();
        for (let i = 0; i < result.length; i++) {
            for (let j = 0; j < headers.length; j++) {
                if (!result[i][j]?.skip) {
                    newblurred.add(`${i}-${j}`);
                }
            }
        }
        blurred = newblurred;
    }

    function trimTrailingEmptyColumnsAndRows(data: CellData[][]): CellData[][] {
        if (data.length === 0) return data;

        // Find last column with data (check all rows)
        let lastColWithData = data[0].length - 1;
        while (lastColWithData >= 0) {
            const hasDataInColumn = data.some(
                (row) =>
                    row[lastColWithData]?.value !== undefined &&
                    row[lastColWithData]?.value !== null &&
                    row[lastColWithData]?.value !== "",
            );
            if (hasDataInColumn) break;
            lastColWithData--;
        }

        // Trim columns in all rows
        const trimmedCols = data.map((row) =>
            row.slice(0, lastColWithData + 1),
        );

        for (let i = trimmedCols.length - 1; i >= 0; i--) {
            if (
                !trimmedCols[i].some(
                    (cell) =>
                        cell?.value !== undefined &&
                        cell?.value !== null &&
                        cell?.value !== "",
                )
            ) {
                trimmedCols.splice(i, 1);
            }
        }

        return trimmedCols;
    }

    function processSheetWithMerges(worksheet: XLSX.WorkSheet): CellData[][] {
        const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
        const merges = worksheet["!merges"] || [];

        const data: CellData[][] = [];

        for (let row = range.s.r; row <= range.e.r; row++) {
            const rowData: CellData[] = [];
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                const cell = worksheet[cellRef];
                rowData.push({
                    value: cell ? cell.w : "",
                    skip: false,
                });
            }
            data.push(rowData);
        }

        for (const merge of merges) {
            const startRow = merge.s.r;
            const endRow = merge.e.r;
            const col = merge.s.c;
            const rowspan = endRow - startRow + 1;

            if (data[startRow] && data[startRow][col]) {
                data[startRow][col].rowspan = rowspan;
            }

            for (let r = startRow + 1; r <= endRow; r++) {
                if (data[r] && data[r][col]) {
                    data[r][col].skip = true;
                }
            }
        }

        return trimTrailingEmptyColumnsAndRows(data);
    }

    async function handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        const jsonData = XLSX.utils.sheet_to_json<
            (string | number | boolean | undefined)[]
        >(firstSheet, {
            header: 1,
        });

        if (jsonData.length > 0) {
            headers = jsonData[0].map((h) => String(h));
            result = processSheetWithMerges(firstSheet).slice(1);
        }

        const newblurred = new Set<string>();
        for (let i = 0; i < result.length; i++) {
            for (let j = 1; j < headers.length; j++) {
                if (!result[i][j]?.skip) {
                    newblurred.add(`${i}-${j}`);
                }
            }
        }
        blurred = newblurred;
    }
</script>

<div class="p-10 mx-auto bg-surface text-text-main min-h-screen">
    <h1 class="text-3xl font-bold mb-6">Table Viewer</h1>
    <!-- File Input -->
    <div
        class="mb-8 p-6 bg-surface-alt rounded-sm border border-dashed border-border-default text-center"
    >
        <label for="file" class="block text-lg font-medium mb-2 text-text-main"
            >Upload XLSX</label
        >
        <input
            id="file"
            type="file"
            accept=".xlsx"
            onchange={handleFileUpload}
            class="mx-auto text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-surface-header file:text-text-main hover:file:bg-border-default cursor-pointer"
        />
    </div>

    <div class="mb-4 flex gap-2">
        <button
            class="bg-surface-header hover:bg-surface-alt border border-border-default px-4 py-2 rounded-sm text-sm font-semibold transition-colors"
            onclick={blurAll}
        >
            Blur All
        </button>
        <button
            class="bg-surface-header hover:bg-surface-alt border border-border-default px-4 py-2 rounded-sm text-sm font-semibold transition-colors"
            onclick={unblurAll}
        >
            Unblur All
        </button>
    </div>

    <!-- The Table -->
    <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
            <thead>
                <tr class="bg-surface-header">
                    {#each headers as header}
                        <th class=" px-4 py-2 text-left font-semibold">
                            {header}
                        </th>
                    {/each}
                </tr>
            </thead>
            <tbody>
                {#each result as row, i}
                    <tr class="border-b border-base px-3 py-4">
                        {#each row as cell, j}
                            {#if !cell.skip}
                                <td
                                    rowspan={cell.rowspan || 1}
                                    class="group h-20 relative px-4 py-2 transition-all duration-200 align-middle {blurred.has(
                                        `${i}-${j}`,
                                    )
                                        ? 'blur-sm'
                                        : ''}"
                                    onclick={() => toggleReveal(i, j)}
                                >
                                    {#if !blurred.has(`${i}-${j}`)}
                                        <div
                                            class="absolute top-2 right-2 z-10 group-hover:opacity-100 opacity-0 transition-opacity duration-300 ease-in-out"
                                        >
                                            <button
                                                class="cursor-pointer"
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    editingCell =
                                                        editingCell ===
                                                        `${i}-${j}`
                                                            ? null
                                                            : `${i}-${j}`;
                                                }}
                                            >
                                                <Pencil
                                                    size={20}
                                                    class="text-gray-400"
                                                />
                                            </button>
                                            {#if j === 0}
                                                <button
                                                    class="cursor-pointer"
                                                    onclick={(e) => {
                                                        e.stopPropagation();
                                                        result = result.filter(
                                                            (_, idx) =>
                                                                idx < i ||
                                                                idx >=
                                                                    i +
                                                                        (cell.rowspan ||
                                                                            1),
                                                        );
                                                    }}
                                                >
                                                    <Trash
                                                        size={20}
                                                        class="text-gray-400"
                                                    />
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                    {#if editingCell === `${i}-${j}`}
                                        <input
                                            onclick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            type="text"
                                            bind:value={cell.value}
                                            class="w-full bg-transparent text-text-main focus:outline-none"
                                            autofocus
                                            onblur={() => (editingCell = null)}
                                            onkeydown={(e) => {
                                                if (e.key === "Enter") {
                                                    editingCell = null;
                                                }
                                            }}
                                        />
                                    {:else}
                                        {cell.value}
                                    {/if}
                                </td>
                            {/if}
                        {/each}
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>
