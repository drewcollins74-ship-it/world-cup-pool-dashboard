const participantsCsv = `Participant,Team
Andy,France
Andy,Colombia
Andy,Sweden
Andy,Cape Verde
Brian,Netherlands
Brian,Switzerland
Brian,Paraguay
Brian,Saudi Arabia
Bridget,Portugal
Bridget,Norway
Bridget,Curaçao
Bridget,Haiti
Colleen,England
Colleen,Morocco
Colleen,Ivory Coast
Colleen,Czechia
Drew,Brazil
Drew,Panama
Drew,Egypt
Drew,Iraq
Lauren,Mexico
Lauren,Iran
Lauren,Bosnia & Herzegovina
Lauren,Jordan
Luke,Belgium
Luke,Japan
Luke,Scotland
Luke,Qatar
Mark,Spain
Mark,Ecuador
Mark,South Africa
Mark,Ghana
Molly,Canada
Molly,Croatia
Molly,Uzbekistan
Molly,Türkiye
Nicolette,Argentina
Nicolette,Austria
Nicolette,Senegal
Nicolette,New Zealand
Owen,Germany
Owen,Australia
Owen,Tunisia
Owen,DR Congo
Patrick,United States
Patrick,South Korea
Patrick,Algeria
Patrick,Uruguay`;

const rules = {
  group_stage_match_win: 1,
  advance_to_knockout_rounds: 3,
  round_of_32_victory: 5,
  round_of_16_victory: 10,
  quarterfinal_victory: 15,
  semifinal_victory: 20,
  third_place_match_winner: 10,
  world_cup_winner: 30
};

const flags = {
  Algeria:"🇩🇿", Argentina:"🇦🇷", Australia:"🇦🇺", Austria:"🇦🇹", Belgium:"🇧🇪", Brazil:"🇧🇷", Canada:"🇨🇦",
  "Cape Verde":"🇨🇻", Colombia:"🇨🇴", Croatia:"🇭🇷", "Curaçao":"🇨🇼", Czechia:"🇨🇿", "DR Congo":"🇨🇩",
  Ecuador:"🇪🇨", Egypt:"🇪🇬", England:"🏴", France:"🇫🇷", Germany:"🇩🇪", Ghana:"🇬🇭", Haiti:"🇭🇹",
  Iran:"🇮🇷", Iraq:"🇮🇶", "Ivory Coast":"🇨🇮", Japan:"🇯🇵", Jordan:"🇯🇴", Mexico:"🇲🇽", Morocco:"🇲🇦",
  Netherlands:"🇳🇱", "New Zealand":"🇳🇿", Norway:"🇳🇴", Panama:"🇵🇦", Paraguay:"🇵🇾", Portugal:"🇵🇹",
  Qatar:"🇶🇦", "Saudi Arabia":"🇸🇦", Scotland:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", Senegal:"🇸🇳", "South Africa":"🇿🇦",
  "South Korea":"🇰🇷", Spain:"🇪🇸", Sweden:"🇸🇪", Switzerland:"🇨🇭", Tunisia:"🇹🇳", Türkiye:"🇹🇷",
  "United States":"🇺🇸", Uruguay:"🇺🇾", Uzbekistan:"🇺🇿"
};

const aliases = new Map([
  ["usa","United States"], ["united states","United States"], ["korea republic","South Korea"],
  ["south korea","South Korea"], ["côte d'ivoire","Ivory Coast"], ["cote d'ivoire","Ivory Coast"],
  ["curacao","Curaçao"], ["curaçao","Curaçao"], ["turkey","Türkiye"], ["türkiye","Türkiye"],
  ["czech republic","Czechia"], ["dr congo","DR Congo"], ["congo dr","DR Congo"],
  ["bosnia and herzegovina","Bosnia & Herzegovina"]
]);

const roundDefinitions = [
  { key:"r32", label:"Round of 32", short:"R32", scoringLabel:"Round of 32 victory", icon:"⇥", points:rules.round_of_32_victory },
  { key:"r16", label:"Round of 16", short:"R16", scoringLabel:"Round of 16 victory", icon:"⇥", points:rules.round_of_16_victory },
  { key:"qf", label:"Quarterfinals", short:"QF", scoringLabel:"Quarterfinal victory", icon:"♕", points:rules.quarterfinal_victory },
  { key:"sf", label:"Semifinals", short:"SF", scoringLabel:"Semifinal victory", icon:"☆", points:rules.semifinal_victory },
  { key:"third", label:"Third Place", short:"3rd Place", scoringLabel:"Third-place match winner", icon:"♙", points:rules.third_place_match_winner },
  { key:"final", label:"Final", short:"Final", scoringLabel:"World Cup winner", icon:"♛", points:rules.world_cup_winner }
];

const completedStatuses = new Set(["FT", "AET", "PEN"]);
const participants = parseParticipants(participantsCsv);
const generated = window.__WORLD_CUP_RESULTS__ || {};
const fixtures = Array.isArray(generated.fixtures) ? generated.fixtures : [];
const groupFixtures = fixtures.filter((fixture) => getRoundKey(fixture) === "group");
const knockoutFixtures = fixtures.filter((fixture) => !["group", "unknown"].includes(getRoundKey(fixture)));
const groupState = buildGroupState();
const ownerByTeam = new Map(participants.flatMap((participant) => participant.teams.map((team) => [team, participant.name])));
const roundOf32Favorites = Array.isArray(generated.roundOf32Favorites) ? generated.roundOf32Favorites : [];
const favoriteByMatch = new Map(roundOf32Favorites.map((item) => [matchKey(item.match.split(" vs ")), normalizeTeam(item.favoriteToAdvance)]));

const elements = {
  asOfLine:document.querySelector("#asOfLine"),
  progressStrip:document.querySelector("#progressStrip"), leaderboardBody:document.querySelector("#leaderboardBody"),
  leaderboardCards:document.querySelector("#leaderboardCards"), bestPositioned:document.querySelector("#bestPositioned"),
  bracket:document.querySelector("#bracket"), upcomingMatches:document.querySelector("#upcomingMatches"),
  scoringKey:document.querySelector("#scoringKey"),
  mostLikely:document.querySelector("#mostLikely"), mostAlive:document.querySelector("#mostAlive")
};

function parseParticipants(csv) {
  return csv.trim().split(/\r?\n/).slice(1).reduce((pool, row) => {
    const [name, team] = row.split(",").map((value) => value.trim());
    let participant = pool.find((item) => item.name === name);
    if (!participant) { participant = { name, teams:[] }; pool.push(participant); }
    participant.teams.push(team);
    return pool;
  }, []);
}

function normalizeTeam(name = "") {
  const clean = name.trim();
  return aliases.get(clean.toLowerCase()) || clean;
}

function matchKey(teams) {
  return teams.map(normalizeTeam).sort().join("|");
}

function favoriteForFixture(fixture) {
  if (getRoundKey(fixture) !== "r32") return null;
  return favoriteByMatch.get(matchKey(fixtureTeams(fixture))) || null;
}

function getRoundKey(fixture) {
  const value = `${fixture.fixture?.round || fixture.league?.round || ""}`.toLowerCase();
  if (value.includes("group")) return "group";
  if (value.includes("round of 32")) return "r32";
  if (value.includes("round of 16")) return "r16";
  if (value.includes("quarter")) return "qf";
  if (value.includes("semi")) return "sf";
  if (value.includes("third") || value.includes("3rd")) return "third";
  if (value.includes("final")) return "final";
  return "unknown";
}

function isComplete(fixture) { return completedStatuses.has(fixture.fixture?.status?.short); }
function fixtureTeams(fixture) { return [normalizeTeam(fixture.teams?.home?.name), normalizeTeam(fixture.teams?.away?.name)].filter(Boolean); }

function winnerOf(fixture) {
  if (!isComplete(fixture)) return null;
  const explicit = normalizeTeam(fixture.fixture?.winner || fixture.teams?.winner?.name || "");
  if (explicit) return explicit;
  const [home, away] = fixtureTeams(fixture);
  const homeGoals = fixture.goals?.home;
  const awayGoals = fixture.goals?.away;
  if (homeGoals > awayGoals) return home;
  if (awayGoals > homeGoals) return away;
  return null;
}

function buildGroupState() {
  const state = {};
  participants.flatMap((participant) => participant.teams).forEach((team) => {
    state[team] = { wins:0, draws:0, losses:0, status:"pending" };
  });
  groupFixtures.filter(isComplete).forEach((fixture) => {
    const [home, away] = fixtureTeams(fixture);
    if (!home || !away) return;
    if (!state[home]) state[home] = { wins:0, draws:0, losses:0, status:"pending" };
    if (!state[away]) state[away] = { wins:0, draws:0, losses:0, status:"pending" };
    const winner = winnerOf(fixture);
    if (winner === home) { state[home].wins += 1; state[away].losses += 1; }
    else if (winner === away) { state[away].wins += 1; state[home].losses += 1; }
    else { state[home].draws += 1; state[away].draws += 1; }
  });
  Object.values(state).forEach((record) => {
    const played = record.wins + record.draws + record.losses;
    if (record.wins >= 2) record.status = "qualified";
    else if ((record.wins === 0 && record.losses >= 2) || (played >= 3 && record.wins === 0)) record.status = "eliminated";
  });
  Object.entries(generated.teamStatus || {}).forEach(([team, status]) => {
    const normalized = normalizeTeam(team);
    if (state[normalized] && ["qualified", "eliminated", "pending"].includes(status)) state[normalized].status = status;
  });
  knockoutFixtures.forEach((fixture) => fixtureTeams(fixture).forEach((team) => {
    if (state[team]) state[team].status = "qualified";
  }));
  return state;
}

function scoredWinPoints(team) {
  return knockoutFixtures.reduce((total, fixture) => {
    if (winnerOf(fixture) !== team) return total;
    const definition = roundDefinitions.find((round) => round.key === getRoundKey(fixture));
    return total + (definition?.points || 0);
  }, 0);
}

function teamLosses(team) {
  return knockoutFixtures.filter((fixture) => {
    const winner = winnerOf(fixture);
    return isComplete(fixture) && winner && fixtureTeams(fixture).includes(team) && winner !== team;
  });
}

function teamIsAlive(team) {
  if (groupState[team]?.status !== "qualified") return false;
  const losses = teamLosses(team);
  if (!losses.length) return true;
  const semifinalLoss = losses.find((fixture) => getRoundKey(fixture) === "sf");
  if (!semifinalLoss) return false;
  const thirdPlace = knockoutFixtures.find((fixture) => getRoundKey(fixture) === "third" && fixtureTeams(fixture).includes(team));
  return !thirdPlace || !isComplete(thirdPlace);
}

function standings() {
  const rows = participants.map((participant) => {
    const groupWinPoints = participant.teams.reduce((sum, team) => sum + (groupState[team]?.wins || 0) * rules.group_stage_match_win, 0);
    const qualificationPoints = participant.teams.filter((team) => groupState[team]?.status === "qualified").length * rules.advance_to_knockout_rounds;
    const winPoints = participant.teams.reduce((sum, team) => sum + scoredWinPoints(team), 0);
    const aliveTeams = participant.teams.filter(teamIsAlive);
    const groupPoints = groupWinPoints + qualificationPoints;
    const knockoutPoints = winPoints;
    return { ...participant, groupPoints, knockoutPoints, totalPoints:groupPoints + knockoutPoints, aliveTeams };
  });
  rows.sort((a,b) => b.totalPoints - a.totalPoints || b.aliveTeams.length - a.aliveTeams.length || a.name.localeCompare(b.name));
  let previous;
  rows.forEach((row,index) => { row.rank = previous && previous.totalPoints === row.totalPoints ? previous.rank : index + 1; previous = row; });
  return rows;
}

function render() {
  const rows = standings();
  elements.asOfLine.textContent = `Knockout Stage - Updated ${formatUpdatedAt(generated.generatedAt)}`;
  renderProgress();
  renderLeaderboard(rows);
  renderBestPositioned(rows[0]);
  renderBracket(rows[0]);
  renderUpcoming();
  renderScoring();
  renderMostLikely();
  renderMostAlive(rows);
}

function renderProgress() {
  const qualifiedCount = Object.values(groupState).filter((record) => record.status === "qualified").length;
  const items = [{ key:"qualified", label:"Qualified", icon:"♙", points:rules.advance_to_knockout_rounds, complete:qualifiedCount, total:32 }, ...roundDefinitions];
  elements.progressStrip.innerHTML = items.map((item) => {
    const fixturesForRound = item.key === "qualified" ? [] : knockoutFixtures.filter((fixture) => getRoundKey(fixture) === item.key);
    const complete = item.key === "qualified" ? qualifiedCount : fixturesForRound.filter(isComplete).length;
    const expected = item.key === "qualified" ? 32 : ({ r32:16, r16:8, qf:4, sf:2, third:1, final:1 }[item.key] || fixturesForRound.length);
    const done = expected > 0 && complete >= expected;
    const pointsLabel = item.points ? `+${item.points}` : "No points";
    return `<article class="progress-item"><span class="progress-icon">${item.icon}</span><div class="progress-copy"><b>${item.label}</b><strong>${pointsLabel}</strong><small>${done ? "Complete" : "In progress"}</small></div><div class="progress-count">${complete} / ${expected}<span class="${done ? "" : "pending"}">${done ? "●" : "○"}</span></div></article>`;
  }).join("");
}

function renderLeaderboard(rows) {
  if (elements.leaderboardBody) {
    elements.leaderboardBody.innerHTML = rows.map((row) => `<tr class="${row.rank === 1 ? "rank-1" : row.rank === 2 ? "rank-2" : row.rank === 3 ? "rank-3" : row.rank >= 10 ? "rank-low" : ""}"><td class="rank">${row.rank}</td><td class="player">${row.name}</td><td class="total">${row.totalPoints}</td><td>${row.groupPoints}</td><td>${row.knockoutPoints}</td><td>${row.aliveTeams.length}</td></tr>`).join("");
  }
  if (elements.leaderboardCards) {
    elements.leaderboardCards.innerHTML = rows.map((row) => `<div class="mobile-leader-row ${row.rank === 1 ? "rank-1" : row.rank === 2 ? "rank-2" : row.rank === 3 ? "rank-3" : row.rank >= 10 ? "rank-low" : ""}"><span class="rank">${row.rank}</span><span class="player">${row.name}</span><span class="total">${row.totalPoints}</span><span>${row.groupPoints}</span><span>${row.knockoutPoints}</span><span>${row.aliveTeams.length}</span></div>`).join("");
  }
}

function bestPositionedMarkup(row) {
  if (!row) return "";
  return `<div class="best-positioned"><small>Best Positioned Player</small><strong>${row.name}</strong><div class="person">♟</div><b>${row.aliveTeams.length} team${row.aliveTeams.length === 1 ? "" : "s"} alive</b></div>`;
}

function renderBestPositioned(row) { if (elements.bestPositioned) elements.bestPositioned.innerHTML = bestPositionedMarkup(row); }

function renderBracket(bestRow) {
  const bracketRounds = roundDefinitions.filter((round) => ["r32","r16","qf","sf","final"].includes(round.key));
  const columns = bracketRounds.map((round) => {
    const matches = knockoutFixtures.filter((fixture) => getRoundKey(fixture) === round.key).sort(sortByDate);
    return `<section class="bracket-round"><div class="round-title">${round.label}<span>(+${round.points})</span></div>${matches.length ? matches.map(renderBracketMatch).join("") : `<div class="empty-round">Awaiting ${round.label} matchups</div>`}${round.key === "final" ? renderThirdPlace() : ""}</section>`;
  });
  columns.push(`<section class="bracket-round"><div class="round-title">Pool Position</div>${bestPositionedMarkup(bestRow)}</section>`);
  elements.bracket.innerHTML = columns.join("");
}

function renderThirdPlace() {
  const matches = knockoutFixtures.filter((fixture) => getRoundKey(fixture) === "third");
  return matches.length ? `<div class="round-title">Third Place <span>(+${rules.third_place_match_winner})</span></div>${matches.map(renderBracketMatch).join("")}` : "";
}

function renderBracketMatch(fixture) {
  const winner = winnerOf(fixture);
  const teams = fixtureTeams(fixture);
  const favorite = favoriteForFixture(fixture);
  return `<article class="match-card">${teams.map((team,index) => {
    const owner = ownerByTeam.get(team);
    const favoriteMarker = team === favorite ? `<span class="favorite-marker" title="Favorite to advance" aria-label="Favorite to advance">★</span>` : "";
    return `<div class="match-team ${team === winner ? "winner" : ""}"><span>${flags[team] || "□"}</span><span class="team-label"><b>${team || "TBD"}</b>${favoriteMarker}${owner ? `<small class="team-owner">(${owner})</small>` : ""}</span><span>${isComplete(fixture) ? (index === 0 ? fixture.goals?.home : fixture.goals?.away) ?? "" : ""}</span></div>`;
  }).join("")}<small class="match-meta">${isComplete(fixture) ? "Final" : formatEasternDateTime(fixture.fixture?.date)}</small></article>`;
}

function renderUpcoming() {
  const upcoming = knockoutFixtures.filter((fixture) => !isComplete(fixture)).sort(sortByDate);
  elements.upcomingMatches.innerHTML = upcoming.length ? upcoming.slice(0,8).map((fixture,index) => {
    const teams = fixtureTeams(fixture); const round = readableRound(fixture);
    return `<div class="compact-row"><b>${round} ${index + 1} &nbsp; ${teams.join(" vs ") || "Matchup TBD"}</b><small>${formatEasternDateTime(fixture.fixture?.date)}</small></div>`;
  }).join("") : `<div class="empty-message">Upcoming knockout matchups will appear here automatically.</div>`;
}

function renderScoring() {
  const rows = [{label:"Advance to knockout rounds", points:rules.advance_to_knockout_rounds}, ...roundDefinitions.map((round) => ({label:round.scoringLabel, points:round.points}))];
  elements.scoringKey.innerHTML = rows.map((row) => `<div class="score-row"><span>${row.label}</span><b>+${row.points}</b></div>`).join("");
}

function renderMostLikely() {
  elements.mostLikely.innerHTML = roundOf32Favorites.length ? roundOf32Favorites.map((item) => {
    const teams = item.match.split(" vs ").map(normalizeTeam);
    const favorite = normalizeTeam(item.favoriteToAdvance);
    const opponent = teams.find((team) => team !== favorite) || "Opponent TBD";
    const owner = ownerByTeam.get(favorite);
    return `<div class="favorite-pick"><span class="favorite-marker" aria-hidden="true">★</span><div><b>${favorite}${owner ? ` <em>(${owner})</em>` : ""}</b><small>vs ${opponent}</small></div></div>`;
  }).join("") : `<div class="empty-message">Favorite selections have not been added.</div>`;
}

function renderMostAlive(rows) {
  const byTeamsAlive = [...rows].sort((a,b) => b.aliveTeams.length - a.aliveTeams.length || a.name.localeCompare(b.name));
  elements.mostAlive.innerHTML = byTeamsAlive.slice(0,5).map((row) => `<li><b>${row.name}</b><span>${row.aliveTeams.length}</span></li>`).join("");
}

function readableRound(fixture) {
  const key = getRoundKey(fixture);
  if (key === "r32") return "R32";
  return roundDefinitions.find((round) => round.key === key)?.short || "KO";
}

function sortByDate(a,b) { return new Date(a.fixture?.date || 0) - new Date(b.fixture?.date || 0); }
function formatUpdatedAt(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "time unavailable";
  return new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", month:"short", day:"numeric", hour:"numeric", minute:"2-digit", timeZoneName:"short" }).format(date);
}
function formatEasternDateTime(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Time TBD";
  return `${new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }).format(date)} ET`;
}

render();
