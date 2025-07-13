const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const EMOJI_LIST = [
  "🇦",
  "🇧",
  "🇨",
  "🇩",
  "🇪",
  "🇫",
  "🇬",
  "🇭",
  "🇮",
  "🇯",
  "🇰",
  "🇱",
  "🇲",
  "🇳",
  "🇴",
  "🇵",
  "🇶",
  "🇷",
  "🇸",
  "🇹",
];

function parseTime(str) {
  const [hours, minutes] = str.split(":").map(Number);
  return new Date(0, 0, 0, hours, minutes);
}

function formatTime(date) {
  return date.toTimeString().slice(0, 5); // "HH:MM"
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("availability")
    .setDescription("Create a time slot poll for availability")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt.setName("title").setDescription("Title of the poll").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("start")
        .setDescription("Start time (HH:MM)")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("end").setDescription("End time (HH:MM)").setRequired(false)
    ),

  async execute(interaction) {
    // First reply
    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString("title");
    const startInput = interaction.options.getString("start") || "19:00"; // ← valeur par défaut
    const endInput = interaction.options.getString("end") || "22:30"; // ← valeur par défaut

    const start = parseTime(startInput);
    const end = parseTime(endInput);

    // Générer les créneaux
    const slots = [];
    const emojis = [];
    let cursor = new Date(start);
    let emojiIndex = 0;

    while (cursor < end && emojiIndex < EMOJI_LIST.length) {
      const label = formatTime(cursor);
      slots.push({ emoji: EMOJI_LIST[emojiIndex], time: label });
      emojis.push(EMOJI_LIST[emojiIndex]);
      cursor.setMinutes(cursor.getMinutes() + 30);
      emojiIndex++;
    }

    // Créer l'embed
    const embed = new EmbedBuilder()
      .setTitle(`📅 ${title}`)
      .setDescription(
        `🧾 **Cliquez sur les réactions** pour indiquer vos disponibilités.\n\n` +
          `🕒 Créneaux de **${formatTime(start)}** à **${formatTime(end)}**`
      )
      .addFields(
        slots.map((slot) => ({
          name: `${slot.emoji} ${slot.time}`,
          value: "0 vote(s)",
        }))
      )
      .setColor(0x00b0f4)
      .setFooter({
        text: `Créé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    try {
      const pollMessage = await interaction.channel.send({ embeds: [embed] });
      for (const emoji of emojis) {
        await pollMessage.react(emoji);
      }

      await interaction.editReply({
        content: "✅ Sondage publié avec succès.",
        flags: MessageFlags.Ephemeral,
      });

      const collector = pollMessage.createReactionCollector({
        filter: (reaction, user) =>
          !user.bot && emojis.includes(reaction.emoji.name),
        time: 86400000,
        dispose: true,
      });

      const updateEmbed = async () => {
        const fetched = await pollMessage.fetch();
        const updatedFields = slots.map((slot) => {
          const reaction = fetched.reactions.cache.get(slot.emoji);
          const count = reaction ? reaction.count - 1 : 0;
          return {
            name: `${slot.emoji} ${slot.time}`,
            value: `${count} vote(s)`,
          };
        });
        const updated = EmbedBuilder.from(embed).setFields(updatedFields);
        await pollMessage.edit({ embeds: [updated] });
      };

      collector.on("collect", updateEmbed);
      collector.on("remove", updateEmbed);

    } catch (err) {

      console.error("Erreur lors de la création du sondage :", err);
      await interaction.followUp({
        content: "❌ Échec de création du sondage.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
