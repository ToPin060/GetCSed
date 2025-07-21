import { client } from "./models/extends/client.js";
import env from "./services/config.js";

// Workaround for "The current file is a CommonJS module and cannot use 'await' at the top level.ts(1309)"
async function launch(): Promise<void> {
    await client.initialize();
    client.login(env.discord.token);
}

launch();