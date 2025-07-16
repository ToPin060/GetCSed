import path from "node:path";
import { config } from "dotenv";
import { client } from "./models/extended-client.js";
import { fileURLToPath } from "node:url";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), 'env', ".env") });
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), 'env', `.env.${process.env.NODE_ENV}`) });

// Workaround for "The current file is a CommonJS module and cannot use 'await' at the top level.ts(1309)"
async function launch(): Promise<void> {
    await client.initialize();
    client.login(process.env.DISCORD_TOKEN as string);
}

launch();