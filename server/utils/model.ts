import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export type ModelType =
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'deepseek-chat-v3'
  | 'deepseek-r1'
  | 'qwen3-30b'
  | 'qwen3-coder'
  | 'mistral-small'
  | 'devstral-small'
  | 'kimi-k2'
  | 'glm-4.5-air'
  | 'dolphin-mistral-24b'
  | 'llama-4-maverick'
  | 'grok-4-fast' // not free use with byok
  ;

export const supportedModels = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'deepseek-chat-v3',
  'deepseek-r1',
  'qwen3-30b',
  'qwen3-coder',
  'mistral-small',
  'devstral-small',
  'kimi-dev',
  'glm-4.5-air',
  'dolphin-mistral-24b',
  'llama-4-maverick',
  'grok-4-fast' //not free use with byok
];

export const doesSupportToolCalls = (modelType: ModelType): boolean => {
  const models = [
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'deepseek-chat-v3',
    'mistral-small',
    'devstral-small',
    'qwen3-coder',
    'kimi-dev',
    'grok-4-fast'
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
      }).chat('deepseek/deepseek-chat-v3-0324:free');

    case 'deepseek-r1':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('deepseek/deepseek-r1-0528:free');

    case 'kimi-dev':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('moonshotai/kimi-dev-72b');

    case 'qwen3-30b':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('qwen/qwen3-30b-a3b:free');

    case 'qwen3-coder':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('qwen/qwen3-coder:free');

    case 'mistral-small':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('mistralai/mistral-small-3.2-24b-instruct:free');

    case 'devstral-small':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('mistralai/devstral-small-2505:free');

    case 'glm-4.5-air':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('z-ai/glm-4.5-air:free');

    case 'dolphin-mistral-24b':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('cognitivecomputations/dolphin-mistral-24b-venice-edition:free');
    case 'llama-4-maverick': 
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('meta-llama/llama-4-maverick:free');

    case 'grok-4-fast':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('x-ai/grok-4-fast'); //not free use with byok
      
    default:
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required but not provided');
      }
      const googleDef = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return googleDef('gemini-2.0-flash');
  }
}
