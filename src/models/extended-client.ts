import path from "path";
import fs from "fs";
import { Client, ClientEvents, ClientOptions, Collection, GatewayIntentBits, Partials, Snowflake } from "discord.js";
import { fileURLToPath, pathToFileURL } from "url";
import { Event } from "./event.js"
import { Command } from "./command.js";

const options: ClientOptions = {
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
};

class ExtendedClient extends Client {
    private _dirname: string = "";

    public commands: Collection<Snowflake, any> = new Collection();

    public constructor() {
        super(options);
        this._dirname = path.dirname(fileURLToPath(import.meta.url))
        console.log(this._dirname)
    }

    private async _loadEvents(): Promise<void> {
        const eventsPath = path.join(this._dirname, '..', "events");
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);

            try {
                const imported = await import(pathToFileURL(filePath).href);
                const EventClass = imported.default;
                const event = new EventClass();

                if (!event || typeof event.execute !== "function" || !event.name) {
                    console.warn(`[WARNING] L'événement dans ${filePath} manque "name" ou "execute".`);
                    continue;
                }

                console.debug("[DEBUG] Event loaded:", file, "→", event.name);

                if (event.once) {
                    this.once(event.name, (...args) => event.execute(...args));
                } else {
                    this.on(event.name, (...args) => event.execute(...args));
                }
            } catch (err) {
                console.error(`[ERROR] Impossible de charger l'événement ${filePath}:`, err);
            }
        }
    }

    private async _loadCommands(): Promise<void> {
        const commandsPath = path.join(this._dirname, '..', "commands");
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);

            try {
                const imported = await import(pathToFileURL(filePath).href);
                const CommandClass = imported.default;
                const command = new CommandClass();
                if (!command || typeof command.execute !== "function" || !command.data?.name) {
                    console.warn(
                        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
                    );
                    continue;
                }

                console.debug("[DEBUG] Command loaded:", file, "→", command.data.name);
                this.commands.set(command.data.name, command);
            } catch (err) {
                console.error(`[ERROR] Failed to load command at ${filePath}:`, err);
            }
        }
    }

    public async initialize(): Promise<void> {
        await this._loadEvents();
        await this._loadCommands();
    }
}

export const client = new ExtendedClient();