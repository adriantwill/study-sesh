"use client";

import { useEffect } from "react";

export default function ChunkErrorHandler() {
	useEffect(() => {
		const handleError = (event: ErrorEvent) => {
			const isChunkError =
				event.message?.includes("Loading chunk") ||
				event.message?.includes("Failed to fetch dynamically imported module") ||
				event.message?.includes("ChunkLoadError");

			if (isChunkError) {
				window.location.reload();
			}
		};

		window.addEventListener("error", handleError);
		return () => window.removeEventListener("error", handleError);
	}, []);

	return null;
}
