# tezz.chat

## Contributing

<!-- Add open source contributing guide -->

All of our code is open source and we welcome contributions from the community.

<!-- prettier-ignore -->
> [!NOTE] 
> If your change also requires infrastructure changes, please reach out
> and we can work together to make the necessary changes on our end.

<!-- prettier-ignore-end -->

# Setup

1. Fork and clone the repository
2. Ensure you have the LTS version of Node.js installed, as well as the latest
   version of [pnpm](https://pnpm.io).
3. Install the dependencies by running `pnpm install` in the root directory.
4. Copy the `.env.example` file to `.env` and fill in the required environment variables.
   - Make sure to set up the .env variables
5. Create a project on appwrite, login to appwrite-cli.
6. Make sure to update the projectId and projectName to your created project in appwrite.
7. Update the `.env` NUXT_PUBLIC_APPWRITE_PROJECT_ID, NUXT_PUBLIC_APPWRITE_URL, NUXT_PUBLIC_APPWRITE_REALTIME_URL to your projectId and endpoint url, and NUXT_PUBLIC_APPWRITE_DATABASE_ID to this 6846ad30003030d86061.
8. Setup appwrite by running the command `appwrite push collections` `appwrite push buckets`, make sure appwrite-cli is installed.
9. Run the development server with `pnpm dev` or `npm run dev` or `yarn dev` or `bun run dev`.
   - This will start the Next.js development server and you can view the application in your browser at `http://localhost:3000`.
10. Implement your changes in the appropriate files.
