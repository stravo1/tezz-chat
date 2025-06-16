import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export type ModelType =
  | 'gemini-2.0-flash-exp'
  | 'gemini-2.5-flash-preview-05-20'
  | 'deepseek-chat-v3'
  | 'deepseek-r1'
  | 'llama-4-scout'
  | 'qwen3-30b';

export const supportedModels = [
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash-preview-05-20',
  'deepseek-chat-v3',
  'deepseek-r1',
  'llama-4-scout',
  'qwen3-30b',
];

export const doesSupportToolCalls = (modelType: ModelType): boolean => {
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash-preview-05-20',
    'deepseek-chat-v3',
    'llama-4-scout',
  ];
  return models.includes(modelType);
};

export function getModel(modelType: ModelType) {
  switch (modelType) {
    case 'gemini-2.0-flash-exp':
      return google('gemini-2.0-flash-exp');
    case 'gemini-2.5-flash-preview-05-20':
      return google('gemini-2.5-flash-preview-05-20');
    case 'deepseek-chat-v3':
      return createOpenRouter({
        apiKey: process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
      }).chat('deepseek/deepseek-chat-v3-0324:free');
    case 'deepseek-r1':
      return createOpenRouter({
        apiKey: process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
      }).chat('deepseek/deepseek-r1-0528:free');
    case 'llama-4-scout':
      return createOpenRouter({
        apiKey: process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
      }).chat('meta-llama/llama-4-scout:free');
    case 'qwen3-30b':
      return createOpenRouter({
        apiKey: process.env.OPENROUTER_GENERATIVE_AI_API_KEY,
      }).chat('qwen/qwen3-30b-a3b:free');
    default:
      return google('gemini-2.0-flash-exp'); // Default model
  }
}
