import {
  CacheType,
  CommandInteraction,
  inlineCode,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../models/command.js";

class PingCommand extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with 'Pong!' and gives a ping check")
    );
  }

  public override async execute(
    interaction: CommandInteraction<CacheType>
  ): Promise<void> {
    const reply = await interaction.reply({
      content: "Processing...",
      fetchReply: true,
    });

    const ping = reply.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply({
      content: `Pong! Latency is ${inlineCode(`${ping}ms`)}.\nAPI Latency is ${inlineCode(`${interaction.client.ws.ping}ms`)}`,
    });
  }
}

export default PingCommand;