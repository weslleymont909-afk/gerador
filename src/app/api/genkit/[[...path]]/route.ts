import {defineNextApiHandler} from '@genkit-ai/next';
import {ai} from '@/ai/genkit';

export const {GET, POST} = defineNextApiHandler({
  ai,
});
