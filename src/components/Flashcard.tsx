import Image from "next/image";
import { parseMarkdown } from "../lib/markdown";

export default function Flashcard({
  text,
  isBack,
  imageUrl,
}: { text: string; isBack?: boolean; imageUrl?: string | null }) {
  return (
    <div
      className={`text-4xl font-medium text-center text-foreground whitespace-pre-wrap absolute inset-0 w-full h-full bg-muted rounded-xl shadow-lg flex flex-col items-center justify-center p-8 backface-hidden rotate-x-0 ${isBack ? "rotate-y-180 " : ""}`}
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
