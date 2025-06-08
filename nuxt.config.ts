// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: "2025-05-15",
    devtools: { enabled: true },
    modules: ["@nuxt/icon"],
    runtimeConfig: {
        geminiApiKey: process.env.GEMINI_API_KEY || "",
    },
    vite: {
        plugins: [tailwindcss()],
    },
    css: ['./assets/css/main.css'],
});
