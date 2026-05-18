import Link from "next/link";
import { signUpAction } from "@/src/app/actions/auth";
import BrandMark from "@/src/components/ui/BrandMark";

const inputClass =
	"w-full rounded-sm border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export default function SignUpForm() {
	return (
		<div className="w-full max-w-sm space-y-6 rounded-lg bg-muted p-8 shadow">
			<div className="flex flex-col items-center gap-3 text-center">
				<BrandMark size={48} />
				<h1 className="text-3xl font-bold text-foreground">Sign Up</h1>
			</div>
			<form action={signUpAction} className="space-y-4">
				<input
					type="text"
					name="name"
					placeholder="Name"
					autoComplete="name"
					className={inputClass}
					required
				/>
				<input
					type="email"
					name="email"
					placeholder="Email"
					autoComplete="email"
					className={inputClass}
					required
				/>
				<input
					type="password"
					name="password"
					placeholder="Password"
					autoComplete="new-password"
					className={inputClass}
					required
				/>
				<button
					type="submit"
					className="w-full rounded-sm bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-85"
				>
					Sign Up
				</button>
			</form>
			<p className="text-center text-muted-foreground">
				Already have an account?{" "}
				<Link href="/signin" className="text-primary hover:text-foreground">
					Sign in
				</Link>
			</p>
		</div>
	);
}
