import { fileURLToPath, pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { Command } from "./models/command.js";

// Load environment variables
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), 'env', ".env") });
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), 'env', `.env.${process.env.NODE_ENV}`) });

async function deploy(): Promise<void> {
  const commands = [];

  const commandsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file: string) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const imported = await import(pathToFileURL(filePath).href);
    const CommandClass = imported.default;
    const command = new CommandClass();
    if (command && typeof command.execute === "function" && command.data?.name) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);

  // and deploy your commands!
  (async () => {
    try {
      console.log(
        `Started refreshing ${commands.length} application (/) commands.`
      );

      // The put method is used to fully refresh all commands in the guild with the current set
      const data: any = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID as string),
        { body: commands }
      );

      console.log(
        `Successfully reloaded ${data.length} application (/) commands.`
      );
    } catch (error) {
      // And of course, make sure you catch and log any errors!
      console.error(error);
    }
  })();
}

deploy();
