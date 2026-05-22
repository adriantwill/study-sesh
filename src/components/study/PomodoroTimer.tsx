"use client";

import { useEffect, useMemo, useState } from "react";

const focusDurationSeconds = 25 * 60;
const circleRadius = 43;
const circleCircumference = 2 * Math.PI * circleRadius;

function formatTime(totalSeconds: number) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PomodoroTimer() {
	const [remainingSeconds, setRemainingSeconds] =
		useState(focusDurationSeconds);
	const [isRunning, setIsRunning] = useState(false);
	const elapsedProgress =
		(focusDurationSeconds - remainingSeconds) / focusDurationSeconds;
	const progressOffset = useMemo(
		() => circleCircumference * (1 - elapsedProgress),
		[elapsedProgress],
	);
	const isReset = remainingSeconds === focusDurationSeconds && !isRunning;

	useEffect(() => {
		if (!isRunning) return;

		if (remainingSeconds <= 0) {
			setIsRunning(false);
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setRemainingSeconds((currentSeconds) => Math.max(currentSeconds - 1, 0));
		}, 1000);

		return () => window.clearTimeout(timeoutId);
	}, [isRunning, remainingSeconds]);

	function toggleTimer() {
		if (remainingSeconds === 0) {
			setRemainingSeconds(focusDurationSeconds);
		}

		setIsRunning((currentValue) => !currentValue);
	}

	function stopTimer() {
		setIsRunning(false);
		setRemainingSeconds(focusDurationSeconds);
	}

	return (
		<section
			aria-label="Pomodoro timer"
			className="flex min-h-96 w-full flex-col justify-evenly rounded-sm bg-muted p-4 shadow lg:h-1/2 lg:min-h-0"
		>
			<div className="flex items-center justify-center py-4">
				<div className="relative aspect-square w-full max-w-72 ">
					<svg
						viewBox="0 0 100 100"
						role="img"
						aria-label={`${formatTime(remainingSeconds)} remaining`}
						className="h-full w-full"
					>
						<circle
							cx="50"
							cy="50"
							r={circleRadius}
							fill="none"
							stroke="var(--muted-hover)"
							strokeWidth="6"
						/>
						<circle
							cx="50"
							cy="50"
							r={circleRadius}
							fill="none"
							strokeWidth="7"
							strokeLinecap="round"
							strokeDasharray={circleCircumference}
							strokeDashoffset={progressOffset}
							transform="rotate(-90 50 50)"
							className="stroke-primary transition-all duration-300 ease-out"
						/>
					</svg>
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span
							aria-live={isRunning ? "off" : "polite"}
							className="tabular-nums text-5xl font-semibold text-foreground"
						>
							{formatTime(remainingSeconds)}
						</span>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<button
					type="button"
					onClick={stopTimer}
					disabled={isReset}
					className="h-12 rounded-sm border border-border bg-muted-hover font-medium text-foreground/70 transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-55"
				>
					Stop
				</button>
				<button
					type="button"
					onClick={toggleTimer}
					className="h-12 rounded-sm bg-primary font-medium text-primary-foreground transition-opacity hover:opacity-85"
				>
					{isRunning ? "Pause" : "Start"}
				</button>
			</div>
		</section>
	);
}
