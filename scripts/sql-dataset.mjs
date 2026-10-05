// Generates the SQL game's League-style dataset as CSVs in public/apps/sql/.
// Seeded, so re-running gives identical files. Run: node scripts/sql-dataset.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

let seed = 20260601;
const rand = () => { // mulberry32
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const shuffle = (arr) => arr.map((v) => [rand(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const poisson = (l) => { let k = 0, p = 1; const L = Math.exp(-l); do { k++; p *= rand(); } while (p > L); return k - 1; };

// [name, role, class, difficulty, release_year, strength]; Ambessa is never picked (anti-join exercises).
const champs = [
  ['Garen', 'Top', 'Fighter', 1, 2010, 0.3], ['Darius', 'Top', 'Fighter', 2, 2012, 0.1], ['Malphite', 'Top', 'Tank', 1, 2009, 0.2],
  ['Teemo', 'Top', 'Marksman', 2, 2009, -0.3], ['Sett', 'Top', 'Fighter', 1, 2020, 0], ['Ambessa', 'Top', 'Fighter', 3, 2024, 0],
  ['Lee Sin', 'Jungle', 'Fighter', 3, 2011, -0.2], ['Vi', 'Jungle', 'Fighter', 2, 2012, 0.2], ['Amumu', 'Jungle', 'Tank', 1, 2009, 0.4],
  ["Kha'Zix", 'Jungle', 'Assassin', 2, 2012, 0], ['Viego', 'Jungle', 'Assassin', 3, 2021, -0.1],
  ['Annie', 'Mid', 'Mage', 1, 2009, 0.3], ['Ahri', 'Mid', 'Mage', 2, 2011, 0.1], ['Zed', 'Mid', 'Assassin', 3, 2012, -0.2],
  ['Yasuo', 'Mid', 'Fighter', 3, 2013, -0.4], ['Syndra', 'Mid', 'Mage', 2, 2012, 0],
  ['Ashe', 'ADC', 'Marksman', 1, 2009, 0.2], ['Jinx', 'ADC', 'Marksman', 2, 2013, 0.3], ["Kai'Sa", 'ADC', 'Marksman', 2, 2018, 0],
  ['Ezreal', 'ADC', 'Marksman', 3, 2010, -0.3], ['Caitlyn', 'ADC', 'Marksman', 2, 2011, 0],
  ['Thresh', 'Support', 'Tank', 3, 2013, -0.1], ['Leona', 'Support', 'Tank', 1, 2011, 0.2], ['Lulu', 'Support', 'Controller', 2, 2012, 0.1],
  ['Nami', 'Support', 'Controller', 2, 2012, 0.2], ['Lux', 'Support', 'Mage', 1, 2010, -0.2],
].map(([name, role, cls, difficulty, year, strength], i) => ({ id: i + 1, name, role, cls, difficulty, year, strength }));

// [name, category, cost]; Mejai's Soulstealer is never bought.
const items = [
  ["Berserker's Greaves", 'Boots', 1100], ["Sorcerer's Shoes", 'Boots', 1100], ['Plated Steelcaps', 'Boots', 1200],
  ["Mercury's Treads", 'Boots', 1250], ['Ionian Boots of Lucidity', 'Boots', 900],
  ['Infinity Edge', 'Damage', 3400], ['Kraken Slayer', 'Damage', 3100], ['Black Cleaver', 'Damage', 3000],
  ['Trinity Force', 'Damage', 3333], ["Youmuu's Ghostblade", 'Damage', 2800], ['Bloodthirster', 'Damage', 3400],
  ["Lord Dominik's Regards", 'Damage', 3000], ["Rabadon's Deathcap", 'Magic', 3600], ["Luden's Companion", 'Magic', 2900],
  ["Zhonya's Hourglass", 'Magic', 3250], ['Void Staff', 'Magic', 3000], ["Mejai's Soulstealer", 'Magic', 1500],
  ['Sunfire Aegis', 'Defense', 2700], ['Thornmail', 'Defense', 2450], ["Randuin's Omen", 'Defense', 2700],
  ['Guardian Angel', 'Defense', 3200], ["Sterak's Gage", 'Defense', 3200], ['Moonstone Renewer', 'Support', 2200],
  ['Redemption', 'Support', 2300], ['Locket of the Iron Solaris', 'Support', 2200],
].map(([name, category, cost], i) => ({ id: i + 1, name, category, cost }));
const itemId = (name) => items.find((i) => i.name === name).id;
const ids = (...names) => names.map(itemId);
const builds = { // class -> [boots options, core pool]
  Marksman: [ids("Berserker's Greaves"), ids('Infinity Edge', 'Kraken Slayer', "Lord Dominik's Regards", 'Bloodthirster', 'Guardian Angel', "Youmuu's Ghostblade")],
  Mage: [ids("Sorcerer's Shoes", 'Ionian Boots of Lucidity'), ids("Rabadon's Deathcap", "Luden's Companion", "Zhonya's Hourglass", 'Void Staff')],
  Assassin: [ids('Ionian Boots of Lucidity', 'Plated Steelcaps'), ids("Youmuu's Ghostblade", 'Black Cleaver', "Lord Dominik's Regards", 'Guardian Angel', 'Bloodthirster')],
  Fighter: [ids('Plated Steelcaps', "Mercury's Treads"), ids('Trinity Force', 'Black Cleaver', "Sterak's Gage", 'Thornmail', 'Guardian Angel', 'Sunfire Aegis')],
  Tank: [ids('Plated Steelcaps', "Mercury's Treads"), ids('Sunfire Aegis', 'Thornmail', "Randuin's Omen", 'Locket of the Iron Solaris', 'Redemption')],
  Controller: [ids('Ionian Boots of Lucidity'), ids('Moonstone Renewer', 'Redemption', 'Locket of the Iron Solaris', "Zhonya's Hourglass")],
};

const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
const tiers = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master'];
const names = ['NightOwl', 'BaronStealer', 'WardPls', 'GankMeNot', 'xXFlashXx', 'TiltProof', 'CSMachine', 'DragonSoul',
  'MidOrFeed', 'SilentSupp', 'JungleDiff', 'TopGap', 'PentaPal', 'MinionLord', 'RiftWalker', 'BlueBuff', 'RedSide',
  'Smite4Days', 'Kiter', 'OneTrickPony', 'LastHitLuc', 'TowerDiver', 'ShyFlash', 'Ignite', 'BushCamper', 'Recall',
  'SoloQHero', 'PinkWard', 'NoMana', 'AFKFarmer'];
const regions = ['EUW', 'EUW', 'EUW', 'NA', 'KR'];
const players = names.map((name, i) => ({
  id: i + 1, name, region: pick(regions), main: roles[i % 5],
  tier: i === 29 ? '' : tiers[Math.min(7, Math.floor(rand() * 5 + rand() * 4))], // last player: unranked (NULL)
  created: `20${int(19, 25)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
}));
const active = players.slice(0, 28); // players 29 and 30 never played

const patches = [['2026-06-01', '26.11'], ['2026-06-15', '26.12'], ['2026-06-29', '26.13'], ['2026-07-13', '26.14'], ['2026-07-27', '26.15'], ['2026-08-10', '26.16']];
const pad = (n) => String(n).padStart(2, '0');
const matches = [], parts = [], buys = [];
for (let m = 1; m <= 120; m++) {
  const day = new Date(Date.UTC(2026, 5, 1) + Math.floor(((m - 1) / 120) * 92 + rand()) * 864e5);
  const date = day.toISOString().slice(0, 10);
  const playedAt = `${date} ${pad(int(10, 23))}:${pad(int(0, 59))}:00`;
  const patch = patches.filter(([d]) => d <= date).at(-1)[1];
  const r = rand(), queue = r < 0.65 ? 'ranked_solo' : r < 0.85 ? 'ranked_flex' : 'normal';
  const duration = int(1150, 2500);
  const pool = shuffle(active), lineup = [], usedChamps = new Set();
  for (const team of ['blue', 'red']) for (const role of roles) {
    const k = pool.findIndex((p) => p.main === role);
    const player = k >= 0 && rand() < 0.75 ? pool.splice(k, 1)[0] : pool.shift();
    const champ = pick(champs.filter((c) => c.role === role && c.name !== 'Ambessa' && !usedChamps.has(c.id)));
    usedChamps.add(champ.id); lineup.push({ team, role, player, champ });
  }
  const power = (team) => lineup.filter((l) => l.team === team).reduce((s, l) => s + l.champ.strength, 0);
  const winner = rand() < 1 / (1 + Math.exp(-(power('blue') - power('red') + 0.1))) ? 'blue' : 'red';
  matches.push([m, playedAt, patch, queue, duration, winner]);
  for (const { team, role, player, champ } of lineup) {
    const win = team === winner, min = duration / 60;
    const kills = poisson({ Top: 4, Jungle: 5, Mid: 6, ADC: 6.5, Support: 1.5 }[role] * (win ? 1.3 : 0.75));
    const deaths = poisson(win ? 3 : 5.5);
    const assists = poisson({ Top: 5, Jungle: 8, Mid: 6, ADC: 6, Support: 12 }[role] * (win ? 1.3 : 0.8));
    const cs = Math.round(min * ({ Support: 1.2, Jungle: 5.5 }[role] ?? 7) * (0.8 + rand() * 0.4));
    const gold = Math.round(500 + min * 120 + cs * 21 + kills * 300 + assists * 110 + rand() * 400);
    parts.push([m, player.id, team, role, champ.id, kills, deaths, assists, cs, gold, win]);
    const [boots, core] = builds[champ.cls];
    const build = [pick(boots), ...shuffle(core)].slice(0, Math.max(2, Math.min(6, Math.floor(min / 6.5))));
    build.forEach((item, slot) => buys.push([m, player.id, slot + 1, item]));
  }
}

const csv = (header, rows) => [header, ...rows.map((r) => r.map((v) => (/[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(','))].join('\n') + '\n';
const out = 'public/apps/sql';
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/champions.csv`, csv('champion_id,name,role,class,difficulty,release_year', champs.map((c) => [c.id, c.name, c.role, c.cls, c.difficulty, c.year])));
writeFileSync(`${out}/items.csv`, csv('item_id,name,category,cost', items.map((i) => [i.id, i.name, i.category, i.cost])));
writeFileSync(`${out}/players.csv`, csv('player_id,summoner_name,region,rank_tier,main_role,created_at', players.map((p) => [p.id, p.name, p.region, p.tier, p.main, p.created])));
writeFileSync(`${out}/matches.csv`, csv('match_id,played_at,patch,queue,duration_s,winning_team', matches));
writeFileSync(`${out}/participants.csv`, csv('match_id,player_id,team,role,champion_id,kills,deaths,assists,cs,gold,win', parts));
writeFileSync(`${out}/participant_items.csv`, csv('match_id,player_id,slot,item_id', buys));
console.log(`matches ${matches.length}, participants ${parts.length}, items bought ${buys.length}`);
