"use client";

import { CalendarDays, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	addDeadlineAction,
	deleteDeadlineAction,
	updateDeadlineDueDateAction,
} from "@/src/app/actions";
import EditField from "@/src/components/questions/EditField";
import NewItemButton from "@/src/components/ui/NewItemButton";
import type { Tables } from "@/src/types/database.types";

type DueDatePanelSide = "left" | "right";
type Deadline = Tables<"deadlines">;

const dueDatePanelTitles: Record<DueDatePanelSide, string> = {
	left: "Due Dates",
	right: "This Week",
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function getStartOfToday() {
	const today = new Date();
	return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getInputValueForDaysUntil(daysUntil: number) {
	const date = getStartOfToday();
	date.setDate(date.getDate() + daysUntil);
	const localDate = new Date(date);
	localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
	return localDate.toISOString().slice(0, 10);
}

function getDaysUntilDate(dateInputValue: string) {
	const [year, month, day] = dateInputValue.split("-").map(Number);
	const dueDate = new Date(year, month - 1, day);
	return Math.ceil(
		(dueDate.getTime() - getStartOfToday().getTime()) / millisecondsPerDay,
	);
}

function getDaysUntilLabel(daysUntil: number | null) {
	if (daysUntil === null) {
		return "No date";
	}

	if (daysUntil < 0) {
		const overdueDays = Math.abs(daysUntil);
		return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
	}

	if (daysUntil === 0) {
		return "Due today";
	}

	return `${daysUntil} ${daysUntil === 1 ? "day" : "days"} until`;
}

function getDateInputValue(dueDate: string | null) {
	return dueDate?.slice(0, 10) ?? "";
}

function sortDeadlines(deadlines: Deadline[]) {
	return [...deadlines].sort((a, b) => {
		const dueDateCompare = (a.due_date ?? "9999-12-31").localeCompare(
			b.due_date ?? "9999-12-31",
		);

		if (dueDateCompare !== 0) return dueDateCompare;

		return a.created_at.localeCompare(b.created_at);
	});
}

export default function DueDatesPanel({
	side,
	deadlines,
}: {
	side: DueDatePanelSide;
	deadlines: Deadline[];
}) {
	const title = dueDatePanelTitles[side];
	const dateInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
	const [items, setItems] = useState<Deadline[]>(() =>
		sortDeadlines(deadlines),
	);

	useEffect(() => {
		setItems(sortDeadlines(deadlines));
	}, [deadlines]);

	function openDatePicker(item: Deadline) {
		const dateInput = dateInputRefs.current[item.id];
		dateInput?.focus();

		if (typeof dateInput?.showPicker === "function") {
			dateInput.showPicker();
			return;
		}

		dateInput?.click();
	}

	async function handleDueDateChange(item: Deadline, dueDate: string) {
		const nextDueDate = dueDate || null;
		const previousDueDate = item.due_date;

		setItems((currentItems) =>
			sortDeadlines(
				currentItems.map((currentItem) =>
					currentItem.id === item.id
						? { ...currentItem, due_date: nextDueDate }
						: currentItem,
				),
			),
		);

		try {
			await updateDeadlineDueDateAction(item.id, nextDueDate);
		} catch (error) {
			console.error("Failed to update deadline:", error);
			setItems((currentItems) =>
				sortDeadlines(
					currentItems.map((currentItem) =>
						currentItem.id === item.id
							? { ...currentItem, due_date: previousDueDate }
							: currentItem,
					),
				),
			);
		}
	}

	async function addNewItem() {
		try {
			const deadline = await addDeadlineAction(getInputValueForDaysUntil(0));
			setItems((currentItems) =>
				currentItems.some((item) => item.id === deadline.id)
					? sortDeadlines(currentItems)
					: sortDeadlines([...currentItems, deadline]),
			);
		} catch (error) {
			console.error("Failed to add deadline:", error);
		}
	}

	async function deleteItem(item: Deadline) {
		const confirmed = confirm(
			`Delete this deadline "${item.title ?? "Untitled"}"?`,
		);
		if (!confirmed) return;

		const previousItems = items;
		setItems((currentItems) =>
			currentItems.filter((currentItem) => currentItem.id !== item.id),
		);

		try {
			await deleteDeadlineAction(item.id);
		} catch (error) {
			console.error("Failed to delete deadline:", error);
			setItems(previousItems);
		}
	}

	return (
		<aside
			aria-label={`${title} due dates`}
			className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-border/70 bg-muted p-4 text-foreground shadow lg:h-full"
		>
			<div className="mb-5 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-3xl font-medium">{title}</h2>
				</div>
				{/*<span className="rounded-md border border-border bg-background/70 px-2.5 py-1 text-sm font-semibold">
					{getDeadlineSummary(items.length)}
				</span>*/}
			</div>
			<hr className="border-border" />

			<ul className="min-h-0 flex-1 divide-y divide-border/70 overflow-y-auto">
				{items.length === 0 ? (
					<li className="py-8 text-center text-sm text-muted-foreground">
						No deadlines yet.
					</li>
				) : (
					items.map((item) => {
						const dateInputValue = getDateInputValue(item.due_date);
						const daysUntil = dateInputValue
							? getDaysUntilDate(dateInputValue)
							: null;

						return (
							<li key={item.id} className="py-4">
								<div className="flex min-w-0 items-center gap-2 text-base  justify-between leading-tight">
									<div className="flex w-fit gap-2 text-xl ">
										<EditField
											textField={item.title ?? "Untitled"}
											id={String(item.id)}
											table="deadlines"
											col="title"
										/>
									</div>
									<div className="flex items-center gap-2">
										<span className="min-w-0 truncate font-light text-sm">
											{getDaysUntilLabel(daysUntil)}
										</span>
										<div className="flex shrink-0 items-center">
											<input
												ref={(element) => {
													dateInputRefs.current[item.id] = element;
												}}
												type="date"
												aria-label={`Due date for ${item.title ?? "Untitled"}`}
												value={dateInputValue}
												onChange={(event) =>
													void handleDueDateChange(item, event.target.value)
												}
												className="sr-only"
											/>
											<button
												type="button"
												aria-label={`Choose due date for ${item.title ?? "Untitled"}`}
												onClick={() => openDatePicker(item)}
												className="flex size-8 cursor-pointer items-center justify-center hover:text-primary"
											>
												<CalendarDays className="size-4" aria-hidden="true" />
											</button>
											<button
												type="button"
												aria-label={`Delete deadline ${item.title ?? "Untitled"}`}
												onClick={() => void deleteItem(item)}
												className="flex size-8 cursor-pointer items-center justify-center hover:text-primary"
											>
												<Trash2 className="size-4" aria-hidden="true" />
											</button>
										</div>
										<div className="flex items-center justify-between gap-2 text-sm text-foreground"></div>
									</div>
								</div>
							</li>
						);
					})
				)}
			</ul>

			<NewItemButton action={addNewItem} />
		</aside>
	);
}
