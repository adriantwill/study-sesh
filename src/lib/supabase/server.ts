import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../../types/database.types";

export async function createClient() {
	const cookieStore = await cookies();

	// biome-ignore lint/style/noNonNullAssertion: env vars guaranteed at runtime
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	// biome-ignore lint/style/noNonNullAssertion: env vars guaranteed at runtime
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	return createServerClient<Database>(url, key, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					for (const { name, value, options } of cookiesToSet) {
						cookieStore.set(name, value, options);
					}
				} catch {
					// The `setAll` method was called from a Server Component.
					// This can be ignored if you have middleware refreshing
					// user sessions.
				}
			},
		},
	});
}
