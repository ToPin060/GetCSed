import { CacheType, CommandInteraction, SlashCommandBuilder } from "discord.js";


export abstract class Command {
    public readonly data: SlashCommandBuilder;

    constructor(slashCommandBuilder: SlashCommandBuilder) {
        this.data = slashCommandBuilder;
    };

    public abstract execute(interaction: CommandInteraction<CacheType>): Promise<void>;
};