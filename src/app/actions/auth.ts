"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/src/lib/auth";

export async function signUpAction(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	const name = formData.get("name") as string;
	await auth.api.signUpEmail({ body: { email, password, name } });
	redirect("/");
}
export async function signInAction(formData: FormData) {
	const email = formData.get("email") as string;
	const password = formData.get("password") as string;
	await auth.api.signInEmail({ body: { email, password } });
	redirect("/");
}
export async function signOutAction() {
	await auth.api.signOut({ headers: await headers() });
	redirect("/");
}
