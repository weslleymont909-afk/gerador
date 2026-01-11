import {createNextApiHandler} from '@genkit-ai/next';

// O fluxo de IA referenciado abaixo não existe e estava causando erro no build.
// import '@/ai/flows/detect-errors-in-text';

export const {GET, POST} = createNextApiHandler();
