"use client";
import { ImageIcon } from "lucide-react";
import { uploadImageAction } from "../app/actions";

interface ImageUploadButtonProps {
	id: string;
}

export default function ImageUploadButton({ id }: ImageUploadButtonProps) {
	const uploadImageWithId = uploadImageAction.bind(null, id);

	return (
		<form action={uploadImageWithId} className="flex items-center">
			<label
				htmlFor={`file-upload-${id}`}
				aria-label="Upload image"
				className={`flex items-center justify-center cursor-pointer hover:text-secondary`}
			>
				<ImageIcon size={16} />
			</label>
			<input
				id={`file-upload-${id}`}
				name="file"
				type="file"
				accept="image/*"
				className="hidden "
				onChange={(e) => e.target.form?.requestSubmit()}
			/>
		</form>
	);
}
