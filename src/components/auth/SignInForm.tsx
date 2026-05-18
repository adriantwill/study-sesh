import { signInAction } from "@/src/app/actions/auth";
import BaseAuthForm from "@/src/components/auth/BaseAuthForm";

export default function SignInForm() {
	return (
		<BaseAuthForm
			title="Sign In"
			action={signInAction}
			fields={[
				{
					type: "email",
					name: "email",
					placeholder: "Email",
					autoComplete: "email",
				},
				{
					type: "password",
					name: "password",
					placeholder: "Password",
					autoComplete: "current-password",
				},
			]}
			submitLabel="Sign In"
			footerText="Need an account?"
			footerHref="/signup"
			footerLinkText="Sign up"
		/>
	);
}
