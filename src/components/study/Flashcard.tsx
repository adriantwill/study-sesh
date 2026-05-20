import Image from "next/image";
import { parseMarkdown } from "@/src/lib/markdown";

export default function Flashcard({
	text,
	isBack,
	imageUrl,
}: {
	text: string;
	isBack?: boolean;
	imageUrl?: string | null;
}) {
	return (
		<div
			className={`absolute inset-0 flex size-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-muted p-8 text-center text-4xl font-medium whitespace-pre-wrap text-foreground shadow-lg backface-hidden rotate-x-0 transition-[box-shadow,transform,background-color] duration-300 ease-out before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-white/70 group-hover:shadow-2xl group-active:shadow-md motion-reduce:transition-none ${isBack ? "rotate-y-180" : ""}`}
		>
			<span className="text-justify">{parseMarkdown(text)}</span>
			{imageUrl && (
				<Image
					src={imageUrl}
					alt="supporting image"
					width={500}
					height={100}
					className="mt-3 rounded-md border border-muted-foreground/20"
				/>
			)}
		</div>
	);
}
