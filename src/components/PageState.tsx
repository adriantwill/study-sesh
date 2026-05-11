"use client";

interface LoadingStateProps {
	message: string;
}

interface ErrorStateProps {
	title: string;
	message: string;
	onReset: () => void;
}

export function LoadingState({ message }: LoadingStateProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<div className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
				<p className="mt-4 text-muted-foreground">{message}</p>
			</div>
		</div>
	);
}

export function ErrorState({ title, message, onReset }: ErrorStateProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-8">
			<div className="w-full max-w-md rounded-lg bg-muted p-8 text-center shadow">
				<h2 className="mb-4 text-2xl font-bold text-foreground">{title}</h2>
				<p className="mb-6 text-muted-foreground">{message}</p>
				<button
					type="button"
					onClick={onReset}
					className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:opacity-85"
				>
					Try again
				</button>
			</div>
		</div>
	);
}
