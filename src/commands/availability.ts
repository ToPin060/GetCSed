import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  CacheType,
  User,
  MessageReaction,
} from "discord.js";
import { Command } from "../models/command.js";
import { Slot } from "../models/interfaces/slots.js";
import { AvailabilityContext } from "../models/availability-context.js";
import { formatTime } from "../utils/format.js";
import { EMOJI_BOMB, EMOJI_LGBT_FLAG, EMOJI_ROULETTE } from "../utils/emoji.js";

/**
 * Command description
 */
const data = (new SlashCommandBuilder()
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
  )) as SlashCommandBuilder;

class AvailabilityCommand extends Command {
  private _context: AvailabilityContext = new AvailabilityContext();

  constructor() {
    super(data);
  }

  public override async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      // Prepare Discord interaction reply
      await interaction.deferReply({ ephemeral: true });

      // Reset & Initialize command context
      this._context = new AvailabilityContext(interaction);
      this._generateEmbed(interaction);

      // Send Embedded message
      const channel = interaction.channel as TextChannel;
      this._context.message = await channel.send({ embeds: [this._context.embed] });

      // Set reacts
      (async () => {
        for (const emoji of this._context.emojis) {
          await this._context.message?.react(emoji);
        }

        await channel.send({
          content: '@everyone',
          allowedMentions: {
            parse: ['everyone'],
          },
        });
      })()

      await this._context.message.startThread({
        name: 'Discussion publique',
        reason: 'Discussion liée à ce message',
      });

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
      await interaction.editReply({
        content: "❌ Échec de création du sondage.",
      });
    }
  }

  private async _onCollectorUpdate(reaction: MessageReaction, user: User, isCollect: boolean) {
    this._updateVoters(reaction, user, isCollect);
    const updatedFields = this._updateEmbed();
    const updated = EmbedBuilder.from(this._context.embed).setFields(updatedFields);
    await this._context.message?.edit({ embeds: [updated] });
  }

  private _generateEmbed(interaction: ChatInputCommandInteraction<CacheType>) {
    this._context.embed = new EmbedBuilder()
      .setTitle(`📅 ${this._context.title}`)
      .setDescription(
        `\n🧾 **Cliquez sur les réactions** pour indiquer vos disponibilités.\n` +
        `🕒 Créneaux de **${formatTime(this._context.start)}** à **${formatTime(this._context.end)}**`
      )
      .addFields(
        this._context.slots.map((slot) => ({
          name: `${slot.emoji} ${slot.label} - 0 vote(s)`,
          value: "—",
        }))
      )
      .setColor(0x00b0f4)
      .setFooter({
        text: `Créé par ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();
  }

  private _updateVoters(reaction: MessageReaction, user: User, isCollect: boolean) {
    const emojiKey = reaction.emoji.name!;
    const existing = this._context?.voters.get(emojiKey) || [];

    if (isCollect) {
      if (!existing.includes(user.displayName)) {
        existing.push(user.displayName);
      }
      this._context?.voters.set(emojiKey, existing);
    } else {
      const updated = existing.filter(u => u !== user.displayName);
      this._context?.voters.set(emojiKey, updated);
    }
    
    const channel = this._context.message?.channel as TextChannel
    if (existing.length === 5) {
      if (reaction.emoji.name === EMOJI_LGBT_FLAG) {
        channel.send({
          content: '# [NOTICE] Congrats! We have a full GAYYY squad! ' + EMOJI_LGBT_FLAG +
            '\n\t' + existing.map(u => `• ${u}`).join("\n\t") +
            '\n\n@everyone',
          allowedMentions: {
            parse: ['everyone'],
          },
        });
      }
      else {
        channel.send({
          content: '# [NOTICE] Congrats! We have a full squad! ' + EMOJI_BOMB +
            '\n\t' + existing.map(u => `• ${u}`).join("\n\t") +
            '\n\n@everyone',
          allowedMentions: {
            parse: ['everyone'],
          },
        });
      }
    } else if (existing.length >= 6) {
      channel.send({
        content: '# [NOTICE] ROULETTE! ' + EMOJI_ROULETTE +
          '\n\t' + existing.map(u => `• ${u}`).join("\n\t") +
          '\n\n@everyone',
        allowedMentions: {
          parse: ['everyone'],
        },
      });
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
