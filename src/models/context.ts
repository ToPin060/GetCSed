import { CacheType, ChatInputCommandInteraction, Collection, EmbedBuilder, Message, Snowflake } from "discord.js";
import { Slot } from "./interfaces/slots.js";
import { EMOJI_LETTER_LIST, EMOJI_LGBT_FLAG } from "../utils/emoji.js";
import { formatTime, parseTime } from "../utils/format.js";

export interface UserInfo {
    id: string,
    name: string,
}

export interface Context {
    guildId: string,
    channelId: string,
    messageId: string,
    message?: Message,
    title: string,
    start: Date,
    end: Date,
    slots: Slot[],
    emojis: string[],
    voters: Collection<string, UserInfo[]>,
    embed: any,
    displayName: string,
    displayAvatarURL: string
}

export function generateContext(interaction: ChatInputCommandInteraction<CacheType>, message: Message): Context {
    // Base Context
    let context: Context = {
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        messageId: message.id,
        message: message,
        title: interaction.options.getString("title", true),
        start: parseTime(interaction.options.getString("start") || "19:00"),
        end: parseTime(interaction.options.getString("end") || "23:00"),
        slots: [],
        emojis: [],
        voters: new Collection<string, UserInfo[]>(),
        embed: null,
        displayName: interaction.user.displayName,
        displayAvatarURL: interaction.user.displayAvatarURL(),
    };

    // Emojis & slots
    let cursor = new Date(context.start);
    let emojiIndex = 0;
    while (cursor < context.end && emojiIndex < EMOJI_LETTER_LIST.length) {
        const label = formatTime(cursor);
        context.slots.push({ emoji: EMOJI_LETTER_LIST[emojiIndex], label: label });
        context.emojis.push(EMOJI_LETTER_LIST[emojiIndex]);
        cursor.setMinutes(cursor.getMinutes() + 30);
        emojiIndex++;
    }
    context.slots.push({ emoji: EMOJI_LGBT_FLAG, label: "GAY" });
    context.emojis.push(EMOJI_LGBT_FLAG);

    context.embed = generateEmbed(context);

    return context;
}

export function generateEmbed(context: Context): any {
    return context.embed = new EmbedBuilder()
        .setTitle(`📅 ${context.title}`)
        .setDescription(
            `\n🧾 **Cliquez sur les réactions** pour indiquer vos disponibilités.\n` +
            `🕒 Créneaux de **${formatTime(context.start)}** à **${formatTime(context.end)}**`
        )
        .addFields(
            context.slots.map((slot) => ({
                name: `${slot.emoji} ${slot.label} - 0 vote(s)`,
                value: "—",
            }))
        )
        .setColor(0x00b0f4)
        .setFooter({
            text: `Créé par ${context.displayName}`,
            iconURL: context.displayAvatarURL,
        })
        .setColor("Green")
        .setTimestamp();
}

// Serialization
export function toJson(context: Context): any {
    const { message, embed, voters, ...rest } = context;
    return {
        ...rest,
        start: rest.start.toISOString(),
        end: rest.end.toISOString(),
    };
}

// Deserialization
export function toContext(json: any): Context {
    return {
        guildId: json.guildId,
        channelId: json.channelId,
        messageId: json.messageId,
        title: json.title,
        start: new Date(json.start),
        end: new Date(json.end),
        slots: json.slots as Slot[],
        emojis: json.emojis,
        voters: new Collection<string, UserInfo[]>(),
        embed: json.embed,
        displayName: json.displayName,
        displayAvatarURL: json.displayAvatarURL
    };
}
