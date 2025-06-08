import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"
import "dotenv/config"

if (!process.env.NUXT_TURSO_DATABASE_URL) {
  console.error("❌ DB_URL environment variable is not set!")
  process.exit(1)
}

const client = createClient({
  url: process.env.NUXT_TURSO_DATABASE_URL,
  authToken: process.env.NUXT_TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })

export { schema, client }

// For transactions, use the db.transaction method from drizzle
// Example usage:
// await db.transaction(async (tx) => {
//   await tx.insert(users).values(...);
//   await tx.insert(otherTable).values(...);
// });