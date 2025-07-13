import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export type ModelType =
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.5-flash-preview-05-20'
  | 'deepseek-chat-v3'
  | 'deepseek-r1'
  | 'llama-4-scout'
  | 'qwen3-30b'
  | 'mistral-small'
  | 'devstral-small';

export const supportedModels = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash-preview-05-20',
  'deepseek-chat-v3',
  'deepseek-r1',
  'llama-4-scout',
  'qwen3-30b',
  'mistral-small',
  'devstral-small',
];

export const doesSupportToolCalls = (modelType: ModelType): boolean => {
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash-preview-05-20',
    'deepseek-chat-v3',
    // 'llama-4-scout',
    'mistral-small',
    'devstral-small',
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

  switch (modelType) {
    case 'gemini-2.0-flash-exp':
    case 'gemini-2.5-flash-preview-05-20':
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required but not provided');
      }
      let google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return google(modelType);

    case 'deepseek-chat-v3':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('deepseek/deepseek-chat-v3-0324:free');

    case 'deepseek-r1':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('deepseek/deepseek-r1-0528:free');

    case 'llama-4-scout':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('meta-llama/llama-4-scout:free');

    case 'qwen3-30b':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('qwen/qwen3-30b-a3b:free');
    case 'mistral-small':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('mistralai/mistral-small-3.2-24b-instruct-2506:free');
    case 'devstral-small':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('mistralai/devstral-small-2505:free');

    default:
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required but not provided');
      }
      const googleDef = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return googleDef('gemini-2.0-flash-exp');
  }
}
