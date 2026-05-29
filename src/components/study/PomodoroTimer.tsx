"use client";

import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
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
	const [isFullscreen, setIsFullscreen] = useState(false);
	const elapsedProgress =
		(focusDurationSeconds - remainingSeconds) / focusDurationSeconds;
	const dogAngle = elapsedProgress * 2 * Math.PI - Math.PI / 2;
	const dogPosition = useMemo(
		() => ({
			x: 50 + circleRadius * Math.cos(dogAngle),
			y: 50 + circleRadius * Math.sin(dogAngle),
		}),
		[dogAngle],
	);
	const dogRotationDegrees = elapsedProgress * 360;
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

	useEffect(() => {
		if (isRunning) {
			document.title = `${formatTime(remainingSeconds)} | Study Sesh`;
		}
	}, [remainingSeconds, isRunning]);

	return (
		<div
			className={
				isFullscreen
					? "fixed inset-0 z-50 flex items-center justify-center bg-black/60"
					: ""
			}
		>
			<section
				aria-label="Pomodoro timer"
				className={
					isFullscreen
						? "flex aspect-square min-w-100dvw flex-col items-center justify-start gap-4 rounded-sm bg-muted p-4 shadow"
						: "flex min-h-0 w-full flex-col justify-evenly gap-4 rounded-sm bg-muted p-4 shadow lg:h-1/2"
				}
				style={
					isFullscreen
						? { width: "min(calc(100dvw - 6rem), calc(100dvh - 6rem))" }
						: undefined
				}
			>
				<div className="flex items-center justify-center gap-3 h-1/8">
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
					<button
						type="button"
						onClick={() => setIsFullscreen((currentValue) => !currentValue)}
						aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen timer"}
						title={isFullscreen ? "Exit fullscreen" : "Fullscreen timer"}
						className="flex size-12 items-center justify-center rounded-sm border border-border bg-muted-hover text-foreground/70 shadow-sm transition-colors hover:bg-background"
					>
						{isFullscreen ? (
							<Minimize2 aria-hidden="true" size={25} />
						) : (
							<Maximize2 aria-hidden="true" size={25} />
						)}
					</button>
				</div>
				<div
					className="grid min-h-[min(75vw,28rem)] w-full flex-1 place-items-center lg:min-h-0"
					style={{ containerType: "size" }}
				>
					<div
						className="relative aspect-square"
						style={{ width: "min(100cqw, 100cqh)" }}
					>
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
								strokeWidth="12"
							/>
						</svg>
						<img
							src={dogImage.src}
							alt=""
							aria-hidden="true"
							draggable={false}
							className="pointer-events-none absolute z-20 h-auto w-3/10 select-none drop-shadow-md"
							style={{
								imageRendering: "pixelated",
								left: `${dogPosition.x}%`,
								top: `${dogPosition.y}%`,
								transform: `translate(-50%, -62%) rotate(${dogRotationDegrees}deg)`,
								transformOrigin: "50% 62%",
								transition:
									"left 1s linear, top 1s linear, transform 1s linear",
							}}
						/>
						<span
							aria-live={isRunning ? "off" : "polite"}
							className="pointer-events-none absolute inset-0 flex items-center justify-center tabular-nums text-5xl font-semibold text-foreground"
						>
							{formatTime(remainingSeconds)}
						</span>
					</div>
				</div>
			</section>
		</div>
	);
}
