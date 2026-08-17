"use client";

import { Trash2 } from "lucide-react";
import { deleteItemByNameAction } from "@/src/db/queries";
import type { DeleteItemName } from "@/src/types";

interface DeleteButtonProps {
	id: string;
	table: DeleteItemName;
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
			await deleteItemByNameAction(id, table);
		}
	}

	return (
		<button
			type="button"
			onClick={handleDelete}
			aria-label={`Delete ${table}`}
			className="flex cursor-pointer items-center justify-center hover:text-primary"
		>
			<Trash2 size={16} />
		</button>
	);
}
