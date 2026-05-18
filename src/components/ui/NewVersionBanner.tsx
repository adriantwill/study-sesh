"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const VERSION_POLL_INTERVAL_MS = 60_000;

function getVersion(payload: unknown) {
	if (
		typeof payload === "object" &&
		payload !== null &&
		"version" in payload &&
		typeof payload.version === "string"
	) {
		return payload.version;
	}

	return null;
}

export default function NewVersionBanner() {
	const initialVersion = useRef<string | null>(null);
	const [hasUpdate, setHasUpdate] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const checkVersion = async () => {
			try {
				const response = await fetch(`/version.json?t=${Date.now()}`, {
					cache: "no-store",
				});

				if (!response.ok) {
					return;
				}

				const version = getVersion(await response.json());

				if (!version) {
					return;
				}

				if (initialVersion.current === null) {
					initialVersion.current = version;
					return;
				}

				if (isMounted && version !== initialVersion.current) {
					setHasUpdate(true);
				}
			} catch {
				// No banner is better than noisy errors if the version check fails.
			}
		};

		checkVersion();
		const interval = window.setInterval(checkVersion, VERSION_POLL_INTERVAL_MS);

		return () => {
			isMounted = false;
			window.clearInterval(interval);
		};
	}, []);

	if (!hasUpdate) {
		return null;
	}

	return (
		<div
			aria-live="polite"
			className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-md border border-border bg-background p-4 text-foreground shadow-lg"
		>
			<span className="text-base font-medium">New version available.</span>
			<button
				type="button"
				onClick={() => window.location.reload()}
				className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
			>
				<RefreshCw aria-hidden="true" className="size-4" />
				Reload
			</button>
		</div>
	);
}
