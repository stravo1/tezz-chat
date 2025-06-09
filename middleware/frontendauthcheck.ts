import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import Session from 'supertokens-web-js/recipe/session';
import { initSuperTokensWebJS } from '~/config/frontend';

export default defineNuxtRouteMiddleware(async () => {
  // Initialize SuperTokens Web JS if not already initialized
  console.log("coming here");
  initSuperTokensWebJS();
  // Check if session exists
  const hasSession = await Session.doesSessionExist();
  if (!hasSession) {
    return navigateTo('/login');
  }
});
