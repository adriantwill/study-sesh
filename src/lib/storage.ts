import { createClient } from "./supabase/server";

const BUCKET = "question-images";

export async function uploadFile(
  path: string,
  file: File,
): Promise<{ error: Error | null }> {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(BUCKET).upload(path, file);

  return { error: error ? new Error(error.message) : null };
}

export async function getPublicUrl(path: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
