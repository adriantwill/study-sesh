import { signInAction } from "@/src/app/actions/auth";
import BaseAuthForm from "@/src/components/auth/BaseAuthForm";

export default function SignInForm() {
	return (
		<BaseAuthForm
			title="Sign In"
			action={signInAction}
			submitLabel="Sign In"
			footerText="Need an account?"
			footerHref="/signup"
			footerLinkText="Sign up"
		/>
	);
}
