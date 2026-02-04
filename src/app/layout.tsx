import type { Metadata } from "next";
import { Faustina } from "next/font/google";
import "./globals.css";

const faustina = Faustina({
	variable: "--font-faustina",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Study Sesh",
	description: "Custom flashcards from your slides",
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
				{children}
			</body>
		</html>
	);
}
