import Link from "next/link";
import BrandMark from "./BrandMark";
import EditField from "./EditField";

interface EditTitleProps {
	title: string;
	reviewId: string;
}

export default function EditTitle({ title, reviewId }: EditTitleProps) {
	return (
		<h1 className="flex min-w-0 flex-1 flex-nowrap items-center gap-2 text-3xl font-bold text-foreground">
			<Link href="/" aria-label="Go to home page">
				<BrandMark size={32} />
			</Link>
			<Link
				href={`/uploads/${reviewId}`}
				className="flex min-w-0 flex-1 items-center gap-2 [&>span]:block [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:overflow-hidden [&>span]:whitespace-nowrap [&>textarea]:min-w-0 [&>textarea]:flex-1 [&>div]:shrink-0"
			>
				<EditField
					textField={title}
					id={reviewId}
					table={"uploads"}
					col={"filename"}
				/>
			</Link>
		</h1>
	);
}
