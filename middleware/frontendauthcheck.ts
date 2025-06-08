import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import Session from 'supertokens-web-js/recipe/session';

export default defineNuxtRouteMiddleware( async () => {
  // redirect the user to the login screen if they're not authenticated
  if (!await Session.doesSessionExist()) {
    return navigateTo('/login')
  }
})
