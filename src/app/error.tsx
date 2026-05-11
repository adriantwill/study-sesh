"use client";

import { ErrorState } from "@/src/components/PageState";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this naming
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<ErrorState
			title="Something went wrong"
			message={error.message}
			onReset={reset}
		/>
	);
}
