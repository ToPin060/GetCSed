import { Event } from "../models/event.js"
import { Client, Events } from "discord.js";
import AvailabilityCommand from "../commands/availability.js";
import { client } from "../models/extends/client.js";

class ClientReadyEvent extends Event<Events.ClientReady> {
    public constructor() {
        super(Events.ClientReady, true);
    };

    public override async execute(_: Client): Promise<void> {
        console.log(`[INFO] ✅ Bot ready as ${client.user?.tag}`);

        await AvailabilityCommand.initialize();
        console.log(`[INFO] ✅ Availability command initialized`);
    };
};

export default ClientReadyEvent;