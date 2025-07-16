import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
  TextChannel,
  CacheType,
  User,
  MessageReaction,
  Collection,
  Snowflake,
  Message,
  ChannelType,
} from "discord.js";
import { Command } from "../models/command.js";
import { Slot } from "../models/interfaces/slots.js";
import { AvailabilityContext } from "../models/interfaces/availability-context.js";
import { formatTime, parseTime } from "../utils/format.js";

const EMOJI_LIST = [
  "🇦", "🇧", "🇨", "🇩", "🇪",
  "🇫", "🇬", "🇭", "🇮", "🇯",
  "🇰", "🇱", "🇲", "🇳", "🇴",
  "🇵", "🇶", "🇷", "🇸", "🇹",
];

const EMOJI_UNA = "🏳️‍🌈";
const defaultAvaibilityContext = {
  title: "TBD",
  start: parseTime("19:00"),
  end: parseTime("22:30"),
  slots: [],
  emojis: [],
  voters: new Collection<string, Snowflake[]>()
}

class AvailabilityCommand extends Command {
  private _context: AvailabilityContext = defaultAvaibilityContext;

  constructor() {
    super(
      new SlashCommandBuilder()
        .setName("availability")
        .setDescription("Create a time slot poll for availability")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((opt) =>
          opt.setName("title").setDescription("Title of the poll").setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("start").setDescription("Start time (HH:MM)").setRequired(false)
        )
        .addStringOption((opt) =>
          opt.setName("end").setDescription("End time (HH:MM)").setRequired(false)
        ) as SlashCommandBuilder
    );
  }

  public override async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    // Prepare validation message
    await interaction.deferReply({ ephemeral: true });

    this._context = defaultAvaibilityContext;

    // Update context with options
    this._context.title = interaction.options.getString("title", true);
    const start = interaction.options.getString("start");
    if (start !== null) {
      this._context.start = parseTime(start);
    }
    const end = interaction.options.getString("start");
    if (end !== null) {
      this._context.end = parseTime(end);
    }

    this._initializeSlotsAndEmojis()

    // Create default embed
    this._context.embed = this._generateDefaultEmbed(interaction);

    try {
      // Send Embedded message
      const channel = interaction.channel as TextChannel;
      this._context.message = await channel.send({ embeds: [this._context.embed] });

      // Set reacts
      for (const emoji of this._context.emojis) {
        await this._context.message.react(emoji);
      }

      await this._context.message.startThread({
        name: 'Discussion publique',
        reason: 'Discussion liée à ce message',
      });

      await channel.send({
        content: '@everyone',
        allowedMentions: {
          parse: ['everyone'],
        },
      });;

      // Setup collector
      const collector = this._context.message.createReactionCollector({
        filter: (reaction, user) => !user.bot && this._context!.emojis.includes(reaction.emoji.name!),
        time: 86_400_000, // 24h
        dispose: true,
      });
      collector.on("collect", (reaction, user) => this._onCollectorUpdate(reaction, user, true));
      collector.on("remove", (reaction, user) => this._onCollectorUpdate(reaction, user, false));

      // Send status
      await interaction.editReply({
        content: "✅ Sondage publié avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la création du sondage :", error);
      await interaction.followUp({
        content: "❌ Échec de création du sondage.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  private async _onCollectorUpdate(reaction: MessageReaction, user: User, isCollect: boolean) {
    this._updateVoters(reaction, user, isCollect);
    const updatedFields = this._updateEmbed();
    const updated = EmbedBuilder.from(this._context.embed).setFields(updatedFields);
    await this._context.message?.edit({ embeds: [updated] });
  }

  private _initializeSlotsAndEmojis() {
    let cursor = new Date(this._context.start);
    let emojiIndex = 0;
    while (cursor < this._context.end && emojiIndex < EMOJI_LIST.length) {
      const label = formatTime(cursor);
      this._context.slots.push({ emoji: EMOJI_LIST[emojiIndex], label: label });
      this._context.emojis.push(EMOJI_LIST[emojiIndex]);
      cursor.setMinutes(cursor.getMinutes() + 30);
      emojiIndex++;
    }

    this._context.slots.push({ emoji: EMOJI_UNA, label: "GAY" });
    this._context.emojis.push(EMOJI_UNA);
  }


  private _generateDefaultEmbed(interaction: ChatInputCommandInteraction<CacheType>) {
    return new EmbedBuilder()
      .setTitle(`📅 ${this._context.title}`)
      .setDescription(
        `🧾 **Cliquez sur les réactions** pour indiquer vos disponibilités.\n\n🕒 Créneaux de **${formatTime(this._context.start)}** à **${formatTime(this._context.end)}**`
      )
      .addFields(
        this._context.slots.map((slot) => ({
          name: `${slot.emoji} ${slot.label} - 0 vote(s)`,
          value: "—",
        }))
      )
      .setColor(0x00b0f4)
      .setFooter({
        text: `Créé par ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();
  }

  private _updateVoters(reaction: MessageReaction, user: User, isCollect: boolean) {
    const emojiKey = reaction.emoji.name!;
    const existing = this._context?.voters.get(emojiKey) || [];

    if (isCollect) {
      if (!existing.includes(user.username)) {
        existing.push(user.username);
      }
      this._context?.voters.set(emojiKey, existing);
    } else {
      const updated = existing.filter(u => u !== user.username);
      this._context?.voters.set(emojiKey, updated);
    }
  }

  private _updateEmbed() {
    return this._context!.slots.map((slot: Slot) => {
      const userNames = this._context?.voters.get(slot.emoji) || [];
      return {
        name: `${slot.emoji} ${slot.label} - ${userNames.length} vote(s)`,
        value: userNames.length > 0 ? userNames.map(u => `• ${u}`).join("\n") : "—",
      };
    });
  }

}

export default AvailabilityCommand;
