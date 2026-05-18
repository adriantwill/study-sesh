import Link from "next/link";
import { signInAction } from "@/src/app/actions/auth";
import BrandMark from "@/src/components/ui/BrandMark";

const inputClass =
	"w-full rounded-sm border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

export default function SignInForm() {
	return (
		<div className="w-full max-w-sm space-y-6 rounded-lg bg-muted p-8 shadow">
			<div className="flex flex-col items-center gap-3 text-center">
				<BrandMark size={48} />
				<h1 className="text-3xl font-bold text-foreground">Sign In</h1>
			</div>
			<form action={signInAction} className="space-y-4">
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
					autoComplete="current-password"
					className={inputClass}
					required
				/>
				<button
					type="submit"
					className="w-full rounded-sm bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-85"
				>
					Sign In
				</button>
			</form>
			<p className="text-center text-muted-foreground">
				Need an account?{" "}
				<Link href="/signup" className="text-primary hover:text-foreground">
					Sign up
				</Link>
			</p>
		</div>
	);
}
