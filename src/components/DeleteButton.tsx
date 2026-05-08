"use client";

import { Trash2 } from "lucide-react";
import { deleteItemAction } from "../app/actions";
import type { TableName } from "../types";

interface DeleteButtonProps {
	id: string;
	table: TableName;
	name: string;
	displayElement?: () => Promise<void> | void;
}

export default function DeleteButton({
	id,
	table,
	name,
	displayElement,
}: DeleteButtonProps) {
	async function handleDelete() {
		const confirmed = confirm(`Delete this ${table} "${name}"?`);
		if (confirmed) {
			if (displayElement) {
				displayElement();
			}
			await deleteItemAction(id, table);
		}
	}

	return (
		<button
			type="button"
			onClick={handleDelete}
			aria-label={`Delete ${table}`}
			className="flex items-center justify-center hover:cursor-pointer hover:text-primary"
		>
			<Trash2 size={16} />
		</button>
	);
}
