"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GenerationPoller({ enabled }: { enabled: boolean }) {
	const router = useRouter();

	useEffect(() => {
		if (!enabled) return;

		const intervalId = setInterval(() => {
			router.refresh();
		}, 3000);

		return () => clearInterval(intervalId);
	}, [enabled, router]);

	return null;
}
