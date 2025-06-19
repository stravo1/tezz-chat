# Contributing

We're thrilled that you're interested in contributing to **tezz.chat**! Whether you're fixing bugs, adding features, improving docs, or just want to help out, you're welcome here—no matter your experience level. :sparkles:

## New to Open Source?

1. Check out [How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)
2. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md)

## Where to Ask Questions?

1. Browse our [GitHub Issues](https://github.com/stravo1/tezz-chat/issues) to see if your question has already been answered.
2. Join our community on [Discord](https://discord.gg/tkRsEPx6Zz) and ask away! We're happy to help.

As you gain experience, please help answer other people's questions too! :pray:

## What to Work On?

- Start by looking at our [GitHub issues](https://github.com/stravo1/tezz-chat/issues). If you find one that interests you and no one else is working on it, comment to claim it.
- If you have an idea for a new feature or improvement, open an issue to discuss it first.
- Always feel free to ask questions in the issue or on Discord.

### Contributions that are ALWAYS welcome

1. More tests (unit, integration, or end-to-end)
2. Improving documentation or error messages
3. UI/UX improvements
4. Educational content (blog posts, videos, guides)
5. Accessibility enhancements
6. Performance optimizations

## Development Setup

### Prerequisites

- OS: Linux, macOS, or WSL2 on Windows
- [Node.js](https://nodejs.org) v18 or later
- [pnpm](https://pnpm.io) (preferred), or npm/yarn/bun
- [Appwrite](https://appwrite.io) account (for backend features)

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/stravo1/tezz-chat.git
   cd tezz-chat
   ```
2. **Install Dependencies**
   ```bash
   pnpm install
   # or npm install / yarn install / bun install
   ```
3. **Set Up Environment Variables**
   - Copy `.env.example` to `.env` and fill in the required values.

4. **Appwrite Setup**
   - Create a project on [Appwrite](https://appwrite.io).
   - Install the [Appwrite CLI](https://appwrite.io/docs/tooling/command-line/installation):
     ```bash
     curl -sL https://appwrite.io/cli/install.sh | bash
     ```
   - Log in to the Appwrite CLI:
     ```bash
     appwrite login
     ```
   - Update the following `.env` variables with your Appwrite project details:
     - `NUXT_PUBLIC_APPWRITE_PROJECT_ID`: Your Appwrite project ID.
     - `NUXT_PUBLIC_APPWRITE_URL`: Your Appwrite endpoint URL (e.g., `https://cloud.appwrite.io/v1`).
     - `NUXT_PUBLIC_APPWRITE_REALTIME_URL`: Your Appwrite Realtime URL (e.g., `wss://cloud.appwrite.io/v1/realtime`).
     - `NUXT_PUBLIC_APPWRITE_DATABASE_ID`: Set this to your Appwrite database ID, make sure to reflect those changes in `appwrite.json` as well. (e.g., `6846ad30003030d86061`).
   - Push the Appwrite collections and buckets:
     ```bash
     appwrite push collections
     appwrite push buckets
     ```

5. **Run the Dev Server**
   ```bash
   pnpm dev
   # or npm run dev / yarn dev / bun run dev
   ```
6. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

Here's a quick overview of the project layout to help you navigate:

```
tezz-chat/
├── app.vue                  # Main Nuxt app entry
├── nuxt.config.ts           # Nuxt configuration
├── package.json             # Project dependencies and scripts
├── README.md                # Project documentation
├── .gitignore
├── .prettierrc
├── .prettierignore
├── bun.lockb / pnpm-lock.yaml
├── LICENSE
├── appwrite.json            # Appwrite project config
│
├── assets/                  # Static assets (css, images, etc.)
│   └── css/
├── components/              # Reusable Vue components
│   ├── chat/
│   ├── ui/
│   ├── SearchModal.vue
│   ├── SettingsModal.vue
│   ├── LoaderModal.vue
│   ├── Sidebar.vue
│   ├── Footer.vue
│   └── Header.vue
├── composables/             # Nuxt composables (composable functions)
├── layouts/                 # Nuxt layout components
├── lib/                     # Utility libraries
├── pages/                   # Nuxt page components
│   ├── auth/
│   ├── chat/
│   │   ├── shared/
│   │   │   └── [id].client.vue
│   │   ├── [id].client.vue
│   │   └── index.client.vue
│   ├── me/
│   └── about/
├── public/                  # Public static files
├── server/                  # Nuxt server middleware & API
│   ├── api/
│   │   ├── auth/
│   │   │   └── oauth/
│   │   ├── chat/
│   │   │   ├── [id]/
│   │   │   ├── shared/
│   │   │   │   └── [id]/
│   │   │   ├── branch.post.ts
│   │   │   ├── index.post.ts
│   │   │   ├── visibility.post.ts
│   │   │   └── index.get.ts
│   │   ├── upload/
│   │   └── ...
│   ├── appwrite/
│   └── utils/
├── shared/                  # Shared types and logic
│   └── types/
├── stores/                  # Pinia stores (state management)
├── utils/                   # Utility functions
│   └── database/
└── tsconfig.json            # TypeScript config
```

## Submitting a Pull Request

1. Make sure your branch is up to date with `main`.
2. Push your branch and open a PR on GitHub.
3. Reference the relevant issue(s) and describe your changes clearly.
4. Be ready to discuss and iterate—review is a collaborative process!

## Community

tezz.chat is powered by a friendly community. If you have questions, want to discuss ideas, or just want to hang out:

- [GitHub Issues](https://github.com/stravo1/tezz-chat/issues)
- [Discord](https://discord.gg/tkRsEPx6Zz)

Thanks for making tezz.chat better! :rocket:
