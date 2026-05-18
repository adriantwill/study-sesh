"use client";
import { ImageIcon } from "lucide-react";
import { uploadImageAction } from "@/src/app/actions";

interface ImageUploadButtonProps {
	id: string;
}

export default function ImageUploadButton({ id }: ImageUploadButtonProps) {
	return (
		<>
			<label
				htmlFor={`file-upload-${id}`}
				aria-label="Upload image"
				className="flex cursor-pointer items-center justify-center hover:text-primary"
			>
				<ImageIcon size={16} />
			</label>
			<input
				id={`file-upload-${id}`}
				name="file"
				type="file"
				accept="image/*"
				className="hidden"
				onChange={async (e) => {
					const file = e.target.files?.[0];
					if (!file) return;

					const formData = new FormData();
					formData.append("file", file);

					try {
						await uploadImageAction(id, formData);
					} catch (error) {
						console.error("Failed to upload image:", error);
					} finally {
						e.target.value = "";
					}
				}}
			/>
		</>
	);
}
