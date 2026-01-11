import {createNextApiHandler} from '@genkit-ai/next';
import '@/ai/flows/detect-errors-in-text';

export const {GET, POST} = createNextApiHandler();
