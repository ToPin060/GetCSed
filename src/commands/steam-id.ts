import { CacheType, ChatInputCommandInteraction, Collection, SlashCommandBuilder, Snowflake } from "discord.js";
import { Command } from "../models/command.js";
import { db, steamInfoId } from "../services/database.js";
import { CSRank, toCSRank, toJson } from "../models/cs-rank.js";
import { scrapeCSStats } from "../services/scraping.js";

/**
 * Command description
 */
const data = (new SlashCommandBuilder()
    .setName("steam-id")
    .setDescription("Setup your Steam ID (for CS Rank)")
    .addStringOption((opt) =>
        opt.setName("id").setDescription("Steam ID").setRequired(true)
    )) as SlashCommandBuilder;

class SteamIdCommand extends Command {
    private static _ranks: Collection<Snowflake, CSRank> = new Collection();

    constructor() {
        super(data);
    }

    public static async restoreRanks() {
        const collection = db.collection(steamInfoId);
        const snapshot = await collection.get();
        snapshot.docs.map(doc => SteamIdCommand._ranks.set(doc.id, toCSRank(doc.data())));
    }

    private async _save(csRank: CSRank) {
        const docRef = db.collection(steamInfoId).doc(csRank.discordUserId);
        await docRef.set(toJson(csRank));
    }

    public override async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        // Prepare Discord interaction reply
        await interaction.deferReply({ ephemeral: true });
        let steamId: string = interaction.options.getString("id", true);
        const csRank = await scrapeCSStats(interaction.user.id, steamId);
        
        SteamIdCommand._ranks.set(csRank.discordUserId, csRank);
        this._save(csRank);
        
        // Send status
        await interaction.editReply({
            content: `Rank ${csRank.rating}`,
        });
    }
}

export default SteamIdCommand;