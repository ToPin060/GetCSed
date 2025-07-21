export interface DiscordEnvironment {
    token: string,
    clientId: string,
}

export interface GoogleEnvironment {
    cert: string
}

export interface Environment {
    dirname: string,
    nodeEnv: string,
    discord: DiscordEnvironment,
    google: GoogleEnvironment,
}