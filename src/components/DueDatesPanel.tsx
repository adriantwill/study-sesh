"use client";

import { useEffect, useRef, useState } from "react";

type DueDatePanelSide = "left" | "right";

type DueDateItem = {
	title: string;
	context: string;
	due: string;
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
				due: "Today",
				detail: "32 cards left",
				toneClassName: "bg-rose-500",
			},
			{
				title: "Civil War review",
				context: "History",
				due: "Tomorrow",
				detail: "12 min refresh",
				toneClassName: "bg-amber-500",
			},
			{
				title: "Organic reactions",
				context: "Chemistry",
				due: "Friday",
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
				due: "Mon",
				detail: "Ready",
				toneClassName: "bg-emerald-500",
			},
			{
				title: "Anatomy diagrams",
				context: "Lab",
				due: "Wed",
				detail: "21 slides",
				toneClassName: "bg-violet-500",
			},
			{
				title: "Essay terms",
				context: "English",
				due: "Sun",
				detail: "Draft deck",
				toneClassName: "bg-cyan-500",
			},
		],
		footer: "Streak target: 4 days",
	},
};

function getTodayInputValue() {
	const today = new Date();
	today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
	return today.toISOString().slice(0, 10);
}

export default function DueDatesPanel({ side }: { side: DueDatePanelSide }) {
	const panel = dueDatePanels[side];
	const dateInputRef = useRef<HTMLInputElement>(null);
	const [editingDateTitle, setEditingDateTitle] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState("");

	function openDatePicker(item: DueDateItem) {
		setSelectedDate((currentDate) => currentDate || getTodayInputValue());
		setEditingDateTitle(item.title);
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
				{panel.items.map((item) => (
					<li key={item.title} className="py-4 first:pt-0 last:pb-0">
						<div className="flex items-start gap-3">
							<div className="min-w-0 flex-1">
								<div className="flex items-start justify-between gap-3">
									<p className="text-base font-semibold leading-tight">
										{item.title}
									</p>
									{editingDateTitle === item.title ? (
										<input
											ref={dateInputRef}
											type="date"
											aria-label={`Due date for ${item.title}`}
											value={selectedDate}
											onChange={(event) => setSelectedDate(event.target.value)}
											onBlur={() => setEditingDateTitle(null)}
											className="h-8 shrink-0 rounded-md border border-border bg-background px-2 text-sm font-bold text-foreground outline-none transition-shadow focus:ring-2 focus:ring-border"
										/>
									) : (
										<button
											type="button"
											onClick={() => openDatePicker(item)}
											className="shrink-0 cursor-pointer rounded-md border border-border bg-background/70 px-2.5 py-1 text-sm font-bold text-foreground transition-colors hover:bg-muted-hover"
										>
											{selectedDate || item.due}
										</button>
									)}
								</div>
								<p className="mt-1 text-sm text-muted-foreground">
									{item.context} - {item.detail}
								</p>
							</div>
						</div>
					</li>
				))}
			</ul>

			<div className="mt-5 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm font-semibold text-foreground/80">
				{panel.footer}
			</div>
		</aside>
	);
}
