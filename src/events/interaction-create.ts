import { Event } from "../models/event.js"
import { BaseInteraction, Events, MessageFlags } from "discord.js";
import { client } from "../models/extends/client.js";

class InteractionCreateEvent extends Event<Events.InteractionCreate> {
    public constructor() {
        super(Events.InteractionCreate, false);
    };

    public override async execute(interaction: BaseInteraction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: "There was an error while executing this command!",
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    };
};

export default InteractionCreateEvent;