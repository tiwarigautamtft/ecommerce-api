import { generateObject } from 'ai';
import fs from 'fs/promises';
import ms, { StringValue } from 'ms';
import z from 'zod';

import { googleAiModel } from './config';
import { UnprocessableEntity } from './exceptions';

// import cloudinary from '@/config/cloudinary';

// interface CloudinaryUploadResult {
// 	secure_url: string | undefined;
// 	public_id: string | undefined;
// }

// export async function uploadToCloudinary(
// 	file: Exclude<Express.Request['file'], undefined>,
// ): Promise<CloudinaryUploadResult> {
// 	try {
// 		const result = await cloudinary.uploader.upload(file.path, {
// 			folder: 'products',
// 			resource_type: 'image',
// 		});
//
// 		await fs.unlink(file.path);
//
// 		return {
// 			secure_url: result.secure_url,
// 			public_id: result.public_id,
// 		};
// 	} catch (error) {
// 		try {
// 			await fs.unlink(file.path);
// 		} catch {}
// 		throw error;
// 	}
// }

export function sec(s: StringValue): number {
	return ms(s) / 1000;
}

export async function validateWithZodSchema<T extends z.ZodType>(
	schema: T,
	rawData: any,
	message: string = 'Invalid input',
): Promise<z.infer<T>> {
	const validationResult = await schema.safeParseAsync(rawData);
	if (validationResult.error) {
		throw new UnprocessableEntity(
			message,
			z.treeifyError(validationResult.error),
		);
	}

	return validationResult.data;
}

export async function generateTags(name: string, description?: string | null) {
	const { object } = await generateObject({
		model: googleAiModel,
		system: `You are a product tagging assistant. Your task is to analyze the given product name and optional description and return a JSON array of strings called "tags".
- Each tag should be a descriptive keyword or key phrase.
- Tags must contain only lowercase letters, numbers, and spaces - no hyphens or other special characters.
- Use spaces to separate words in multi-word tags instead of hyphens.
- Extract the most relevant features, specifications, and attributes from the product information.
- If no description is provided, generate tags based solely on the product name.
- All tags must be unique - no duplicates.
- Generate at most 25 tags, no more than that.`,
		output: 'array',
		schema: z
			.string()
			.describe(
				'Descriptive product tags, using only lowercase letters, numbers, and spaces. No hyphens or special characters.',
			),
		prompt: description
			? `Product Name: ${name}\nProduct Description: ${description}`
			: `Product Name: ${name}`,
	});

	return object;
}

const preferenceSchema = z.object({
	tag: z.string(),
	weight: z.number().min(1).max(100),
});
type PreferenceSchemaType = z.infer<typeof preferenceSchema>;

export async function generatePreferences(
	tags: string[],
	context: 'viewed' | 'ordered' = 'viewed',
	existingPreferences: PreferenceSchemaType[] = [],
) {
	const { object } = await generateObject({
		model: googleAiModel,
		system: `You are a user preference analyzer. Your task is to generate a preferences array based on input tags and context.

RULES:
- Analyze the input array of tags and generate preference objects with tag names and weights (1-100)
- Use ONLY the tags provided in the input - do not create new tags
- Consider the context (viewed, ordered, etc.) when assigning weights
- If context is not provided, assume "viewed"
- If existing preferences are provided, use them to update weights
- When a tag is already in preferences and its weight is > 80, the weight growth should be slower
- Focus on noun and adjective tags that capture the essence of all tags
- Output ONLY the top 20% of preferences by weight (rounded up)
- Weights range from 1 (least preferred) to 100 (most preferred)
- If there's nothing to update, return an empty array
- Return a JSON array of objects, each with "tag" (string) and "weight" (number)

OUTPUT FORMAT:
[
  {"tag": "example tag", "weight": 85},
  {"tag": "another tag", "weight": 70}
]`,
		output: 'array',
		schema: preferenceSchema,
		prompt: `TAGS: ${JSON.stringify(tags)}
CONTEXT: ${context}
EXISTING PREFERENCES: ${JSON.stringify(existingPreferences)}`,
	});

	return object;
}
