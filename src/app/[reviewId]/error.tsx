"use client";

// biome-ignore lint/suspicious/noShadowRestrictedNames: Next.js requires this naming
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-8">
			<div className="max-w-md w-full bg-muted rounded-lg shadow p-8 text-center">
				<h2 className="text-2xl font-bold text-foreground mb-4">
					Failed to load questions
				</h2>
				<p className="text-muted-foreground mb-6">{error.message}</p>
				<button
					type="button"
					onClick={reset}
					className="bg-button-primary text-button-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-85"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
