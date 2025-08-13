import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  CacheType,
  User,
  MessageReaction,
  Collection,
  Snowflake,
  Client,
  Message,
} from "discord.js";
import { Command } from "../models/command.js";
import { Slot } from "../models/interfaces/slots.js";
import { Context, generateContext, generateEmbed, toContext, toJson, UserInfo } from "../models/context.js";
import { EMOJI_BOMB, EMOJI_LGBT_FLAG, EMOJI_ROULETTE } from "../utils/emoji.js";
import { availabilitiesId, db } from "../services/database.js";
import { client } from "../models/extends/client.js";
import SteamIdCommand, { saveCSRank, updateCSRank } from "./steam-id.js";
import { isMoreThanOneDayOld } from "../utils/date.js";

/**
 * Command description
 */
const data = (new SlashCommandBuilder()
  .setName("pool")
  .setDescription("Create a time slot poll")
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
  private static _contexts: Collection<Snowflake, Context> = new Collection();

  constructor() {
    super(data);
  }

  public static async restoreContexts() {
    const collection = db.collection(availabilitiesId);
    const snapshot = await collection.get();
    snapshot.docs.map(doc => AvailabilityCommand._contexts.set(doc.id, toContext(doc.data())));
  }

  public static async initialize() {
    this._contexts.map(async (value: Context) => {
      value.embed = generateEmbed(value)
      const msg = await fetchMessageById(value.channelId, value.messageId, client);
      if (msg) {
        value.message = msg;
        bindCollectorToMessage(value)
      } else {
        const collection = db.collection(availabilitiesId); 
        const docref = collection.doc(value.guildId);
        await docref.delete();
      }
    })
  }

  public override async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      // Prepare Discord interaction reply
      await interaction.deferReply({ ephemeral: true });

      // Prepare message
      const channel = interaction.channel as TextChannel;
      const message = await channel.send("...");

      // Reset & Initialize command context
      const context = generateContext(interaction, message);
      AvailabilityCommand._contexts.set(interaction.guildId!, context);

      // Send Embedded message
      await message!.edit({ content: "", embeds: [context.embed] });

      (async () => {
        // Set reacts 
        for (const emoji of context.emojis) {
          await context.message?.react(emoji);
        }

        // Tag everyone
        await message.edit({
          content: '@everyone',
          allowedMentions: {
            parse: ['everyone'],
          },
        });

        await this._save(context);
      })()

      await message.startThread({
        name: 'Discussion publique',
        reason: 'Discussion liée à ce message',
      });

      // Setup collector
      bindCollectorToMessage(context);

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

  private async _save(context: Context) {
    const docRef = db.collection(availabilitiesId).doc(context.guildId);
    await docRef.set(toJson(context));
  }
}

async function fetchMessageById(channelId: string, messageId: string, client: Client): Promise<Message | null> {
  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || !channel.isTextBased()) {
      // console.error("Ce channel n'est pas textuel ou n'existe pas.");
      return null;
    }

    const message = await (channel as TextChannel).messages.fetch(messageId);
    return message;
  } catch (error) {
    // console.error('Erreur lors de la récupération du message:', error);
    return null;
  }
}

function bindCollectorToMessage(context: Context) {
  const collector = context.message!.createReactionCollector({
    filter: (reaction, user) => !user.bot && context.emojis.includes(reaction.emoji.name!),
    time: 86_400_000,
    dispose: true,
  });
  collector.on("collect", (reaction, user) => onCollectorUpdate(context, reaction, user, true));
  collector.on("remove", (reaction, user) => onCollectorUpdate(context, reaction, user, false));

}

async function onCollectorUpdate(context: Context, reaction: MessageReaction, user: User, isCollect: boolean) {
  updateVoters(context, reaction, user, isCollect);
  const updatedFields = updateEmbed(context);
  const updated = EmbedBuilder.from(context.embed).setFields(updatedFields);
  await context.message?.edit({ embeds: [updated] });
}

async function updateVoters(context: Context, reaction: MessageReaction, user: User, isCollect: boolean) {
  const emojiKey = reaction.emoji.name!;
  const existing = context.voters.get(emojiKey) || [];

  const currentUserInfo: UserInfo = {id: user.id, name: user.displayName};

  if (isCollect) {
    if (!existing.includes(currentUserInfo)) {
      // Update rank if too old (1day)
      const csrank = SteamIdCommand.ranks.get(user.id)
      if (csrank && isMoreThanOneDayOld(csrank.date)) {
        updateCSRank(user.id, csrank.steamId);
        saveCSRank(csrank);
      }

      existing.push(currentUserInfo);
    }
    context.voters.set(emojiKey, existing);
  } else {
    const updated = existing.filter(u => u.name !== user.displayName);
    context.voters.set(emojiKey, updated);
  }
}

function updateEmbed(context: Context) {
  return context.slots.map((slot: Slot) => {
    const userNames = context.voters.get(slot.emoji) || [];
    return {
      name: `${slot.emoji} ${slot.label} - ${userNames.length} vote(s)`,
      value: '\n' + (userNames.length > 0 ? userNames.map(u => `• ${u.name} *[${SteamIdCommand.ranks.get(u.id)?.rating}]*`).join("\n") : "—"),
    };
  });
}

export default AvailabilityCommand;
