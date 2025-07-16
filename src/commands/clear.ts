import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
  CacheType,
} from "discord.js";
import { Command } from "../models/command.js";

class ClearCommand extends Command {
  public constructor() {
    super(
      new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Deletes recent messages in the channel (max 100 at a time)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    );
  }

  public override async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    const channel = interaction.channel;

    if (!channel?.isTextBased()) {
      await interaction.reply({
        content: "❌ This command can only be used in a text channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: "🚫 You do not have permission to manage messages.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Vérifie que le canal est un TextChannel
    if (channel.type !== 0 && channel.type !== 5) {
      await interaction.reply({
        content: "❌ This command can only be used in standard text channels.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const textChannel = channel as TextChannel;
      const messages = await textChannel.messages.fetch({ limit: 100 });

      const recentMessages = messages.filter(
        (msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
      );

      const deleted = await textChannel.bulkDelete(recentMessages, true);

      await interaction.reply({
        content: `🧹 Deleted ${deleted.size} message(s).`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error while deleting messages:", error);
      await interaction.reply({
        content: "❌ An error occurred while trying to delete messages.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}

export default ClearCommand;
