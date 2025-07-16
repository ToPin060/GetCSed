import { ClientEvents } from "discord.js";

export abstract class Event<Key extends keyof ClientEvents> {
    public readonly name: Key;
    public readonly once: boolean;

    constructor(name: Key, once: boolean) {
        this.name = name;
        this.once = once;
    };
    
    public abstract execute(...args: ClientEvents[Key]): Promise<any>;
};