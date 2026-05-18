import type { Metadata } from "next";
import ChunkErrorHandler from "@/src/components/ui/ChunkErrorHandler";
import NewVersionBanner from "@/src/components/ui/NewVersionBanner";
import "./globals.css";

export const metadata: Metadata = {
	title: "Study Sesh",
	description: "Custom flashcards from your slides",
	icons: {
		icon: [{ url: "/logo.png", type: "image/png" }],
		apple: [{ url: "/icon.png", type: "image/png" }],
		shortcut: ["/icon.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="snap-y snap-mandatory">
			<body className="bg-background font-sans text-foreground antialiased">
				<ChunkErrorHandler />
				<NewVersionBanner />
				{children}
			</body>
		</html>
	);
}
