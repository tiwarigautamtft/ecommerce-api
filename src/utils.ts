import fs from 'fs/promises';
import ms, { StringValue } from 'ms';

import cloudinary from '@/config/cloudinary';

interface CloudinaryUploadResult {
	secure_url: string | undefined;
	public_id: string | undefined;
}

export async function uploadToCloudinary(
	file: Exclude<Express.Request['file'], undefined>,
): Promise<CloudinaryUploadResult> {
	try {
		const result = await cloudinary.uploader.upload(file.path, {
			folder: 'products',
			resource_type: 'image',
		});

		await fs.unlink(file.path);

		return {
			secure_url: result.secure_url,
			public_id: result.public_id,
		};
	} catch (error) {
		try {
			await fs.unlink(file.path);
		} catch {}
		throw error;
	}
}

export function sec(s: StringValue): number {
	return ms(s) / 1000;
}
