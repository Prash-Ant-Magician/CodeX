import { config } from 'dotenv';
config();

import '@/ai/flows/generate-code-snippet.ts';
import '@/ai/flows/debug-code.ts';
import '@/ai/flows/submit-feedback.ts';
import '@/ai/flows/compile-code.ts';
import '@/ai/flows/generate-code-from-prompt.ts';
import '@/ai/flows/run-python.ts';
import '@/ai/flows/run-java.ts';
import '@/ai/flows/suggest-code.ts';
import '@/ai/flows/run-ruby.ts';
import '@/ai/flows/run-r.ts';
import '@/ai/flows/run-typescript.ts';
import '@/ai/flows/generate-code-from-diagram.ts';
