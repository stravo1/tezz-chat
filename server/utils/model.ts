import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';

export type ModelType =
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash'
  | 'gpt-oss-20b'
  | 'deepseek-chat-v3'
  | 'qwen3-32b'
  | 'qwen3-coder'
  | 'mistral-small'
  | 'devstral-small'
  | 'kimi-thinking'
  | 'glm-4.5-air'
  | 'llama-4-maverick'
  | 'grok-4-fast'
  | 'claude-haiku-4-5-anannas'
  | string; // Allow custom model IDs

export const supportedModels = [
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gpt-oss-20b',
  'deepseek-chat-v3',
  'qwen3-32b',
  'qwen3-coder',
  'mistral-small',
  'devstral-small',
  'kimi-thinking',
  'glm-4.5-air',
  'llama-4-maverick',
  'grok-4-fast',
  'claude-haiku-4-5-anannas',
];

// Custom model configuration passed from client
export interface CustomModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'openai' | 'anthropic';
  modelId: string;
  supportsTools: boolean;
}

export const doesSupportToolCalls = (modelType: ModelType): boolean => {
  const models = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'deepseek-chat-v3',
    'mistral-small',
    'codestral-small',
    'qwen3-coder',
    'kimi-dev',
    'grok-4-fast',
    'claude-haiku-4-5-anannas',
  ];
  return models.includes(modelType);
};

interface ModelOptions {
  geminiApiKey?: string;
  openRouterApiKey?: string;
  anannasApiKey?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  customModelConfig?: CustomModelConfig;
}

export function getModel(modelType: ModelType, options: ModelOptions = {}) {
  console.log(options, 'options in getModel');
  const {
    geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    openRouterApiKey = process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
    anannasApiKey = process.env.ANANNAS_API_KEY,
    openaiApiKey = process.env.OPENAI_API_KEY,
    anthropicApiKey = process.env.ANTHROPIC_API_KEY,
    customModelConfig,
  } = options;

  // Handle custom models
  if (modelType.startsWith('custom-') && customModelConfig) {
    return getCustomModel(customModelConfig, {
      geminiApiKey,
      openRouterApiKey,
      openaiApiKey,
      anthropicApiKey,
    });
  }

  console.log(openRouterApiKey);
  const anannas = createOpenAICompatible({
    apiKey: anannasApiKey || '',
    baseURL: 'https://api.anannas.ai/v1',
    name: 'anannas',
    includeUsage: true,
    supportsStructuredOutputs: true,
  });
  switch (modelType) {
    case 'gemini-3-flash-preview':
    case 'gemini-2.5-flash':
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required but not provided');
      }
      let google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return google(modelType);
    case 'gpt-oss-20b':
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat('openai/gpt-oss-20b:free');

    case 'claude-haiku-4-5-anannas':
      return anannas('claude-haiku-4-5');

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
      return googleDef('gemini-3-flash-preview');
  }
}

/**
 * Get a custom model instance based on the custom model configuration
 */
function getCustomModel(
  config: CustomModelConfig,
  keys: {
    geminiApiKey?: string;
    openRouterApiKey?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
  }
) {
  const { provider, modelId } = config;
  const { geminiApiKey, openRouterApiKey, openaiApiKey, anthropicApiKey } = keys;

  switch (provider) {
    case 'gemini':
      if (!geminiApiKey) {
        throw new Error('Gemini API key is required for custom Gemini models');
      }
      const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });
      return google(modelId);

    case 'openrouter':
      if (!openRouterApiKey) {
        throw new Error('OpenRouter API key is required for custom OpenRouter models');
      }
      return createOpenRouter({
        apiKey: openRouterApiKey,
      }).chat(modelId);

    case 'openai':
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is required for custom OpenAI models');
      }
      const openai = createOpenAI({ apiKey: openaiApiKey });
      return openai(modelId);

    case 'anthropic':
      if (!anthropicApiKey) {
        throw new Error('Anthropic API key is required for custom Anthropic models');
      }
      const anthropic = createAnthropic({ apiKey: anthropicApiKey });
      return anthropic(modelId);

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
