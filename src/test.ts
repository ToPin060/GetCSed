import SteamUser from 'steam-user';
import GlobalOffensive, { Ranking } from 'globaloffensive';

let user = new SteamUser();
let csgo = new GlobalOffensive(user);

csgo.on('debug', console.log);
user.on('error', console.error);

user.logOn({
    accountName: "",
    password: ""
});

user.on('loggedOn', res => {
    console.log("Logged into Steam as " + user.steamID!.getSteam3RenderedID());

    user.setPersona(SteamUser.EPersonaState.Online);
    user.gamesPlayed(730);
});

csgo.on('connectedToGC', () => {
    console.log('Connecté au Game Coordinator CS:GO ✅');
    // csgo.requestPlayersProfile(user.steamID!);
    csgo.requestPlayersProfile("76561198156819894"); // MOI ?
    csgo.requestPlayersProfile("76561198172210790"); // Chévre
    csgo.requestPlayersProfile("76561199074125249"); // RANDOM
});

csgo.on('disconnectedFromGC', () => {
    console.log('Déconnecté du Game Coordinator ❌');
});

csgo.on('playersProfile', (profile) => {
    console.log(profile);

    if (profile.ranking) {
        console.log(`🎖️ Ton rang compétitif : ${profile.ranking.rank_id}`);
    } else {
        console.log('❌ Impossible de récupérer ton rang compétitif.');
    }
});

