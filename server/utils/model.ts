import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export type ModelType =
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'deepseek-chat-v3'
  | 'qwen3-32b'
  | 'qwen3-coder'
  | 'mistral-small'
  | 'devstral-small'
  | 'kimi-thinking'
  | 'glm-4.5-air'
  | 'llama-4-maverick'
  | 'grok-4-fast'; // not free use with byok

export const supportedModels = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'deepseek-chat-v3',
  'qwen3-32b',
  'qwen3-coder',
  'mistral-small',
  'devstral-small',
  'kimi-thinking',
  'glm-4.5-air',
  'llama-4-maverick',
  'grok-4-fast', //not free use with byok
];

export const doesSupportToolCalls = (modelType: ModelType): boolean => {
  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'deepseek-chat-v3',
    'mistral-small',
    'codestral-small',
    'qwen3-coder',
    'kimi-dev',
    'grok-4-fast',
  ];
  return models.includes(modelType);
};

interface ModelOptions {
  geminiApiKey?: string;
  openRouterApiKey?: string;
}

export function getModel(modelType: ModelType, options: ModelOptions = {}) {
  console.log(options, 'options in getModel');
  const {
    geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openRouterApiKey = process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
  } = options;

  console.log(openRouterApiKey);
  switch (modelType) {
    case 'gemini-2.0-flash':
    case 'gemini-2.5-flash':
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required but not provided');
      }
      let google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return google(modelType);

    case 'deepseek-chat-v3':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('deepseek/deepseek-v3.2');

    case 'kimi-thinking':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('moonshotai/kimi-k2-thinking');

    case 'qwen3-32b':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('qwen/qwen3-32b');

    case 'qwen3-coder':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('qwen/qwen3-coder-flash');

    case 'mistral-small':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('mistralai/mistral-small-3.1-24b-instruct:free');

    case 'devstral-small':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('mistralai/devstral-2512:free');

    case 'glm-4.5-air':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('z-ai/glm-4.5-air:free');

    case 'llama-4-maverick':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('meta-llama/llama-4-maverick');

    case 'grok-4-fast':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('x-ai/grok-4.1-fast'); //not free use with byok

    default:
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required but not provided');
      }
      const googleDef = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return googleDef('gemini-2.0-flash');
  }
}
