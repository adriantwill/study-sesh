import type { Metadata } from "next";
import { Faustina } from "next/font/google";
import ChunkErrorHandler from "@/src/components/ChunkErrorHandler";
import "./globals.css";

const faustina = Faustina({
	variable: "--font-faustina",
	subsets: ["latin"],
});

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
			<body
				className={`bg-background text-foreground font-sans ${faustina.variable} antialiased`}
			>
				<ChunkErrorHandler />
				{children}
			</body>
		</html>
	);
}
