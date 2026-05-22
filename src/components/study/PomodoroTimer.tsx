"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import runningDog from "@/src/app/Running.gif";
import sittingDog from "@/src/app/Sitting.png";

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
	const dogAngle = elapsedProgress * 2 * Math.PI - Math.PI / 2;
	const dogPosition = useMemo(
		() => ({
			x: 50 + circleRadius * Math.cos(dogAngle),
			y: 50 + circleRadius * Math.sin(dogAngle),
		}),
		[dogAngle],
	);
	const dogImage = isRunning ? runningDog : sittingDog;
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
			className="flex min-h-96 w-full flex-col justify-evenly gap-4 rounded-sm bg-muted p-4 shadow lg:h-1/2 lg:min-h-0"
		>
			<div className="flex items-center justify-center gap-3">
				<button
					type="button"
					onClick={toggleTimer}
					aria-label={isRunning ? "Pause timer" : "Start timer"}
					title={isRunning ? "Pause timer" : "Start timer"}
					className="flex size-12 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-85"
				>
					{isRunning ? (
						<Pause aria-hidden="true" size={26} fill="currentColor" />
					) : (
						<Play aria-hidden="true" size={26} fill="currentColor" />
					)}
				</button>
				<button
					type="button"
					onClick={stopTimer}
					disabled={isReset}
					aria-label="Reset timer"
					title="Reset timer"
					className="flex size-12 items-center justify-center rounded-sm border border-border bg-muted-hover text-foreground/70 shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-55"
				>
					<RotateCcw aria-hidden="true" size={25} />
				</button>
			</div>
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
							strokeWidth="10"
						/>
						<circle
							cx="50"
							cy="50"
							r={circleRadius}
							fill="none"
							strokeWidth="10"
							strokeLinecap="round"
							strokeDasharray={circleCircumference}
							strokeDashoffset={progressOffset}
							transform="rotate(-90 50 50)"
							className="stroke-primary relative"
							style={{ transition: "stroke-dashoffset 1s linear" }}
						/>
					</svg>
					<img
						src={dogImage.src}
						alt=""
						aria-hidden="true"
						draggable={false}
						className={`pointer-events-none absolute z-20 h-auto select-none drop-shadow-md ${
							isRunning ? "w-20" : "w-20"
						}`}
						style={{
							imageRendering: "pixelated",
							left: `${dogPosition.x}%`,
							top: `${dogPosition.y}%`,
							transform: "translate(-50%, -62%)",
							transition: "left 1s linear, top 1s linear",
						}}
					/>
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
		</section>
	);
}
