import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

const QUESTION_IMAGES_BUCKET = "image-attachments";
const PDFS_BUCKET = "pdfs";

let client: S3Client;

function requiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not configured`);
	return value;
}

function getClient(): S3Client {
	client ??= new S3Client({
		region: "auto",
		endpoint: requiredEnv("R2_ENDPOINT"),
		credentials: {
			accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
			secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
		},
	});
	return client;
}

export async function uploadFile(
	bucket: string,
	path: string,
	file: File,
): Promise<{ error: Error | null }> {
	try {
		await getClient().send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: path,
				Body: Buffer.from(await file.arrayBuffer()),
				ContentType: file.type || "application/octet-stream",
				IfNoneMatch: "*",
			}),
		);
		return { error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}
}

export async function uploadQuestionImage(path: string, file: File) {
	return uploadFile(QUESTION_IMAGES_BUCKET, path, file);
}

export async function uploadPdf(path: string, file: File) {
	return uploadFile(PDFS_BUCKET, path, file);
}

export async function removeFile(
	path: string,
): Promise<{ error: Error | null }> {
	try {
		await getClient().send(
			new DeleteObjectCommand({ Bucket: PDFS_BUCKET, Key: path }),
		);
		return { error: null };
	} catch (error) {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}
}

export async function getPublicUrl(
	bucket: string,
	path: string,
): Promise<string> {
	if (bucket !== QUESTION_IMAGES_BUCKET) {
		throw new Error(`No public URL configured for bucket: ${bucket}`);
	}
	const baseUrl = requiredEnv("R2_IMAGE_PUBLIC_URL").replace(/\/$/, "");
	return `${baseUrl}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function getQuestionImagePublicUrl(path: string): Promise<string> {
	return getPublicUrl(QUESTION_IMAGES_BUCKET, path);
}
