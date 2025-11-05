import { createGoogleGenerativeAI } from '@ai-sdk/google';

import { env } from './env';

export const google = createGoogleGenerativeAI({
	apiKey: env.GOOGLE_AI_API_KEY,
});

export const googleAiModel = google(env.GOOGLE_AI_MODEL);
