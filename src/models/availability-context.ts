import { CacheType, ChatInputCommandInteraction, Collection, Message, Snowflake } from "discord.js";
import { Slot } from "./interfaces/slots.js";
import { EMOJI_LETTER_LIST, EMOJI_LGBT_FLAG } from "../utils/emoji.js";
import { formatTime, parseTime } from "../utils/format.js";

interface IAvailabilityContext {
    message?: Message,
    embed?: any,
    title: string,
    start: Date,
    end: Date,
    slots: Slot[],
    emojis: string[],
    voters: Collection<string, Snowflake[]>
}

export class AvailabilityContext implements IAvailabilityContext {
    public message?: Message<boolean> | undefined;
    public embed?: any;
    public title: string;
    public start: Date;
    public end: Date;
    public slots: Slot[];
    public emojis: string[];
    public voters: Collection<string, string[]>;

    public constructor(interaction?: ChatInputCommandInteraction<CacheType>) {
        if (interaction) {
            this.title = interaction.options.getString("title", true);
            this.start = parseTime(interaction.options.getString("start") || "19:00");
            this.end = parseTime(interaction.options.getString("end") || "23:00");
        } else {
            this.title = "Title";
            this.start = parseTime("19:00");
            this.end = parseTime("23:00");
        }
        this.slots = [];
        this.emojis = [];
        this.voters = new Collection<string, string[]>;

        this._initializeSlotsAndEmojis()
    }


    private _initializeSlotsAndEmojis() {
        let cursor = new Date(this.start);
        let emojiIndex = 0;
        while (cursor < this.end && emojiIndex < EMOJI_LETTER_LIST.length) {
            const label = formatTime(cursor);
            this.slots.push({ emoji: EMOJI_LETTER_LIST[emojiIndex], label: label });
            this.emojis.push(EMOJI_LETTER_LIST[emojiIndex]);
            cursor.setMinutes(cursor.getMinutes() + 30);
            emojiIndex++;
        }
        this.slots.push({ emoji: EMOJI_LGBT_FLAG, label: "GAY" });
        this.emojis.push(EMOJI_LGBT_FLAG);
    }
}
