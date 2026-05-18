import { signUpAction } from "@/src/app/actions/auth";
import BaseAuthForm from "@/src/components/auth/BaseAuthForm";

export default function SignUpForm() {
	return (
		<BaseAuthForm
			title="Sign Up"
			action={signUpAction}
			fields={[
				{
					type: "text",
					name: "name",
					placeholder: "Name",
					autoComplete: "name",
				},
			]}
			passwordAutoComplete="new-password"
			submitLabel="Sign Up"
			footerText="Already have an account?"
			footerHref="/signin"
			footerLinkText="Sign in"
		/>
	);
}
