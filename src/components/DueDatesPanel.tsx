"use client";

import { CalendarDays } from "lucide-react";
import { useRef, useState } from "react";

type DueDatePanelSide = "left" | "right";

type DueDateItem = {
	title: string;
	context: string;
	daysUntil: number;
	detail: string;
	toneClassName: string;
};

type DueDatePanel = {
	title: string;
	summary: string;
	items: DueDateItem[];
	footer: string;
};

const dueDatePanels: Record<DueDatePanelSide, DueDatePanel> = {
	left: {
		title: "Due Soon",
		summary: "3 active deadlines",
		items: [
			{
				title: "Neuro pathways quiz",
				context: "Bio 204",
				daysUntil: 0,
				detail: "32 cards left",
				toneClassName: "bg-rose-500",
			},
			{
				title: "Civil War review",
				context: "History",
				daysUntil: 1,
				detail: "12 min refresh",
				toneClassName: "bg-amber-500",
			},
			{
				title: "Organic reactions",
				context: "Chemistry",
				daysUntil: 5,
				detail: "4 weak topics",
				toneClassName: "bg-sky-500",
			},
		],
		footer: "Next study block: 25 min",
	},
	right: {
		title: "This Week",
		summary: "5 sessions planned",
		items: [
			{
				title: "Calc practice set",
				context: "Math",
				daysUntil: 1,
				detail: "Ready",
				toneClassName: "bg-emerald-500",
			},
			{
				title: "Anatomy diagrams",
				context: "Lab",
				daysUntil: 3,
				detail: "21 slides",
				toneClassName: "bg-violet-500",
			},
			{
				title: "Essay terms",
				context: "English",
				daysUntil: 7,
				detail: "Draft deck",
				toneClassName: "bg-cyan-500",
			},
		],
		footer: "Streak target: 4 days",
	},
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

function getDaysUntilLabel(daysUntil: number) {
	if (daysUntil < 0) {
		const overdueDays = Math.abs(daysUntil);
		return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
	}

	return `${daysUntil} ${daysUntil === 1 ? "day" : "days"} until`;
}

export default function DueDatesPanel({ side }: { side: DueDatePanelSide }) {
	const panel = dueDatePanels[side];
	const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
	const [selectedDates, setSelectedDates] = useState<Record<string, string>>(
		{},
	);

	function openDatePicker(item: DueDateItem) {
		const dateInput = dateInputRefs.current[item.title];
		dateInput?.focus();

		if (typeof dateInput?.showPicker === "function") {
			dateInput.showPicker();
			return;
		}

		dateInput?.click();
	}

	return (
		<aside
			aria-label={`${panel.title} due dates`}
			className="flex min-h-0 w-full flex-1 flex-col rounded-lg border border-border/70 bg-muted px-4 py-5 text-foreground shadow"
		>
			<div className="mb-5 flex items-start justify-between gap-3">
				<div>
					<h2 className="text-2xl font-bold">{panel.title}</h2>
				</div>
				<span className="rounded-md border border-border bg-background/70 px-2.5 py-1 text-sm font-semibold">
					{panel.summary}
				</span>
			</div>

			<ul className="min-h-0 flex-1 divide-y divide-border/70">
				{panel.items.map((item) => {
					const selectedDate = selectedDates[item.title];
					const dateInputValue =
						selectedDate ?? getInputValueForDaysUntil(item.daysUntil);
					const daysUntil = selectedDate
						? getDaysUntilDate(selectedDate)
						: item.daysUntil;

					return (
						<li key={item.title} className="py-4 first:pt-0 last:pb-0">
							<div className="min-w-0 flex items-center justify-between gap-3 ">
								<p className="text-base font-semibold leading-tight">
									{item.title}
								</p>
								<div className="flex shrink-0 items-center text-sm text-foreground">
									<span>{getDaysUntilLabel(daysUntil)}</span>
									<input
										ref={(element) => {
											dateInputRefs.current[item.title] = element;
										}}
										type="date"
										aria-label={`Due date for ${item.title}`}
										value={dateInputValue}
										onChange={(event) =>
											setSelectedDates((currentDates) => ({
												...currentDates,
												[item.title]: event.target.value,
											}))
										}
										className="sr-only"
									/>
									<button
										type="button"
										aria-label={`Choose due date for ${item.title}`}
										onClick={() => openDatePicker(item)}
										className="flex size-8 cursor-pointer items-center justify-center hover:text-primary"
									>
										<CalendarDays className="size-4" aria-hidden="true" />
									</button>
								</div>
							</div>
						</li>
					);
				})}
			</ul>

			<div className="mt-5 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm font-semibold text-foreground/80">
				{panel.footer}
			</div>
		</aside>
	);
}
