import { Event } from "../models/event.js"
import { Client, Events } from "discord.js";

class ClientReadyEvent extends Event<Events.ClientReady> {
    public constructor() {
        super(Events.ClientReady, true);
    };
    
    public override async execute(client: Client): Promise<void> {
        console.log(`[INFO] ✅ Bot ready as ${client.user?.tag}`);
    };
};

export default ClientReadyEvent;