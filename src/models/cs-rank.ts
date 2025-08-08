export interface CSRank {
  discordUserId: string,
  steamId: string,
  type: string,
  season: string,
  rating: string,
  best: string,
  wins: string,
  date: string,
}

export function toJson(csrank: CSRank): any {
  const { ...rest } = csrank;
  return { ...rest }
}

export function toCSRank(json: any): CSRank {
  return {
    discordUserId: json.discordUserId,
    steamId: json.steamId,
    type: json.type,
    season: json.season,
    rating: json.rating,
    best: json.best,
    wins: json.wins,
    date: json.date,
  }
}