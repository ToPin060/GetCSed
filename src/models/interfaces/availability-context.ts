import { Collection, EmbedBuilder, Message, Snowflake } from "discord.js";
import { Slot } from "./slots";

export interface AvailabilityContext {
    message?: Message,
    embed?: any,
    title: string,
    start: Date,
    end: Date,
    slots: Slot[],
    emojis: string[],
    voters: Collection<string, Snowflake[]>
}
