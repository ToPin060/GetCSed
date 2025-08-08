import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { DiscordEnvironment, Environment, GoogleEnvironment } from "../models/interfaces/environment";

const dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

config({ path: path.join(dirname, '..', 'env', ".env") });
config({ path: path.join(dirname, '..', 'env', `.env.${process.env.NODE_ENV}`) });

const environment: Environment = {
    dirname: dirname,
    nodeEnv: process.env.NODE_ENV as string,
    discord: {
        token: process.env.DISCORD_TOKEN as string,
        clientId: process.env.CLIENT_ID as string,
    } as DiscordEnvironment,
    google: {
        cert: process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 as string,
    } as GoogleEnvironment,
};

export default environment;