import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../types/database.types";

export function createClient() {
	// biome-ignore lint/style/noNonNullAssertion: env vars guaranteed at runtime
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	// biome-ignore lint/style/noNonNullAssertion: env vars guaranteed at runtime
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	return createBrowserClient<Database>(url, key);
}
