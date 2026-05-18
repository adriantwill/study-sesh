import Link from "next/link";
import type { ComponentProps } from "react";
import BrandMark from "@/src/components/ui/BrandMark";

const inputClass =
	"w-full rounded-sm border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

type AuthField = Pick<
	ComponentProps<"input">,
	"type" | "name" | "placeholder" | "autoComplete"
>;

type BaseAuthFormProps = {
	title: string;
	action: (formData: FormData) => Promise<void>;
	fields: AuthField[];
	submitLabel: string;
	footerText: string;
	footerHref: string;
	footerLinkText: string;
};

export default function BaseAuthForm({
	title,
	action,
	fields,
	submitLabel,
	footerText,
	footerHref,
	footerLinkText,
}: BaseAuthFormProps) {
	return (
		<div className="w-full max-w-sm space-y-6 rounded-lg bg-muted p-8 shadow">
			<div className="flex flex-col items-center gap-3 text-center">
				<BrandMark size={48} />
				<h1 className="text-3xl font-bold text-foreground">{title}</h1>
			</div>
			<form action={action} className="space-y-4">
				{fields.map((field) => (
					<input
						key={field.name}
						type={field.type}
						name={field.name}
						placeholder={field.placeholder}
						autoComplete={field.autoComplete}
						className={inputClass}
						required
					/>
				))}
				<button
					type="submit"
					className="w-full rounded-sm bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-85"
				>
					{submitLabel}
				</button>
			</form>
			<p className="text-center text-muted-foreground">
				{footerText}{" "}
				<Link href={footerHref} className="text-primary hover:text-foreground">
					{footerLinkText}
				</Link>
			</p>
		</div>
	);
}
