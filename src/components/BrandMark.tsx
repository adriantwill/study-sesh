import Image from "next/image";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export default function BrandMark({
  size = 40,
  className = "",
}: BrandMarkProps) {
  return (
    <Image
      src="/logo.png"
      alt="Study Sesh logo"
      width={size}
      height={size}
      className={`rounded-sm object-contain ${className}`.trim()}
      priority
    />
  );
}
