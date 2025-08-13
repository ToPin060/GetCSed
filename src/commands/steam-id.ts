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
    public static ranks: Collection<Snowflake, CSRank> = new Collection();

    constructor() {
        super(data);
    }

    public static async restoreRanks() {
        const collection = db.collection(steamInfoId);
        const snapshot = await collection.get();
        snapshot.docs.map(doc => SteamIdCommand.ranks.set(doc.id, toCSRank(doc.data())));
    }

    public override async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        // Prepare Discord interaction reply
        await interaction.deferReply({ ephemeral: true });

        // Fetch user rating
        let steamId: string = interaction.options.getString("id", true);
        const csRank = await updateCSRank(interaction.user.id, steamId);
    
        // Store user rating
        SteamIdCommand.ranks.set(csRank.discordUserId, csRank);
        saveCSRank(csRank);
        
        // Send status
        await interaction.editReply({
            content: `Rank ${csRank.rating}`,
        });
    }
}

export default SteamIdCommand;

// Fetch CS2 user rating
export async function updateCSRank(discordId: string, steamId: string): Promise<CSRank> {
    console.debug("SCRAP SCRAP")
    return await scrapeCSStats(discordId, steamId);
}

// Save in DB CS2 user rating
export async function saveCSRank(csrank: CSRank): Promise<boolean> {
    const docRef = db.collection(steamInfoId).doc(csrank.discordUserId);
    await docRef.set(toJson(csrank));
    return true;
}