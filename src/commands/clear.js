const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Deletes recent messages in the channel (max 100 at a time)'),
	async execute(interaction) {
		// Check if the command is used in a text channel
		if (!interaction.channel || !interaction.channel.isTextBased()) {
			return await interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true });
		}

		// Check permissions
		if (!interaction.member.permissions.has('ManageMessages')) {
			return await interaction.reply({ content: 'You do not have permission to manage messages.', ephemeral: true });
		}

		try {
			const messages = await interaction.channel.messages.fetch({ limit: 100 });
			// Less than 14 days old
			const filtered = messages.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);

			await interaction.channel.bulkDelete(filtered, true);

			await interaction.reply({ content: `🧹 Deleted ${filtered.size} messages.`, ephemeral: true });
		}
		catch (error) {
			console.error('Error while deleting messages:', error);
			await interaction.reply({ content: 'An error occurred while trying to delete messages.', ephemeral: true });
		}
	},
};
