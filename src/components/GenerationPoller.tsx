"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
