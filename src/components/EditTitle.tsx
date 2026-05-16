import Link from "next/link";
import BrandMark from "./BrandMark";
import EditField from "./EditField";

interface EditTitleProps {
	title: string;
	reviewId: string;
}

export default function EditTitle({ title, reviewId }: EditTitleProps) {
	return (
		<h1 className="flex min-w-0 items-center justify-center gap-2 text-3xl font-bold text-foreground cursor-pointer">
			<Link href="/" aria-label="Go to home page">
				<BrandMark size={32} />
			</Link>
			<Link
				href={`/uploads/${reviewId}`}
				className="flex min-w-0 items-center gap-2 cursor-pointer"
			>
				<EditField
					textField={title}
					id={reviewId}
					table="uploads"
					col="filename"
				/>
			</Link>
		</h1>
	);
}
