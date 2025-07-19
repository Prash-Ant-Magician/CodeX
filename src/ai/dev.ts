import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code-snippet.ts';
import '@/ai/flows/debug-code.ts';
import '@/ai/flows/submit-feedback.ts';
import '@/ai/flows/compile-code.ts';
