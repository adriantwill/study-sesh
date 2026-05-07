import { createClient } from "./supabase/server";

const QUESTION_IMAGES_BUCKET = "question-images";
const PDFS_BUCKET = "pdfs";

export async function uploadFile(
	bucket: string,
	path: string,
	file: File,
): Promise<{ error: Error | null }> {
	const supabase = await createClient();

	const { error } = await supabase.storage.from(bucket).upload(path, file);

	return { error: error ? new Error(error.message) : null };
}

export async function uploadQuestionImage(path: string, file: File) {
	return uploadFile(QUESTION_IMAGES_BUCKET, path, file);
}

export async function uploadPdf(path: string, file: File) {
	return uploadFile(PDFS_BUCKET, path, file);
}

export async function removeFile(
	bucket: string,
	path: string,
): Promise<{ error: Error | null }> {
	const supabase = await createClient();

	const { error } = await supabase.storage.from(bucket).remove([path]);

	return { error: error ? new Error(error.message) : null };
}

export async function removePdf(path: string) {
	return removeFile(PDFS_BUCKET, path);
}

export async function getPublicUrl(
	bucket: string,
	path: string,
): Promise<string> {
	const supabase = await createClient();

	const {
		data: { publicUrl },
	} = supabase.storage.from(bucket).getPublicUrl(path);

	return publicUrl;
}

export async function getQuestionImagePublicUrl(path: string): Promise<string> {
	return getPublicUrl(QUESTION_IMAGES_BUCKET, path);
}
