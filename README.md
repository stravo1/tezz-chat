# [tezz.chat](https://tezz.chat) ⚡️
<a href="https://discord.gg/7wFjkVFcMz">
<img src="https://img.shields.io/discord/1385282512300802171?logo=discord" alt="chat on Discord">
</a>

**tezz.chat** is an open-source multi-model, fast AI-powered chat app. Enjoy real-time conversations, image generation, chat branching, and more — all with a modern, beautiful UI.

## Features

- 💬 Chat with multiple models like Gemini, DeepSeek (and more coming soon!)
- 🔄 Sync history across devices 
- 🖼️ Image generation
- 🌳 Chat branching (fork a new chat from any message)
- 💡 Dynamic code highlighting (theme-aware)
- 📎 Attachment support: upload images and pdfs and ask questions on them!
- 📤 Shareable chats!
- 🌐 Web search and get latest info!
- 📱 Responsive & mobile-friendly
- 📌 Local first
- 🔑 Option to Bring Your Own Keys ;)

## Architecture

tezz.chat is built with three main layers:

1. **Frontend**: Nuxt 3 (Vue) app for chat UI, code highlighting, and RxDB (with Dexie) for syncing database.
2. **Backend**: Nuxt server API routes, Appwrite SDK for database/auth, Vercel's AI SDK for everything else.
3. **Appwrite**: Handles user accounts, chat/message storage, file uploads.


## Quick Start

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, development, and contribution instructions.

## Community & Support

- **Discord**: [Join our tezz.chat Discord](https://discord.gg/7wFjkVFcMz) for real-time help and troubleshooting!.
- **GitHub Issues**: [Report bugs or request features](https://github.com/stravo1/tezz-chat/issues)

## License

This project is licensed under the [MIT License](LICENSE).

---
