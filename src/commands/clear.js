const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription(
      "Deletes recent messages in the channel (max 100 at a time)"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    // Ensure it's a text channel
    if (!interaction.channel || !interaction.channel.isTextBased()) {
      return await interaction.reply({
        content: "This command can only be used in a text channel.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check permission
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return await interaction.reply({
        content: "You do not have permission to manage messages.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const recentMessages = messages.filter(
        (msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
      );

      await interaction.channel.bulkDelete(recentMessages, true);

      await interaction.reply({
        content: `🧹 Deleted ${recentMessages.size} messages.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error while deleting messages:", error);
      await interaction.reply({
        content: "An error occurred while trying to delete messages.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
