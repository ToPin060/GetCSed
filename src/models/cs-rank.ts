export interface CSRank {
  discordUserId: string,
  steamId: string,
  type: string,
  season: string,
  rating: string,
  best: string,
  wins: string,
  date: Date,
}

export function toJson(csrank: CSRank): any {
  const { date, ...rest } = csrank;
  return { ...rest,
    date: date.toDateString()
  }
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
    date: new Date(json.date),
  }
}