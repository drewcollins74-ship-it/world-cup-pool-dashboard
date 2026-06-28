const sampleTeams = {};

const flags = {
  Algeria: "🇩🇿", Argentina: "🇦🇷", Australia: "🇦🇺", Austria: "🇦🇹", Belgium: "🇧🇪", Brazil: "🇧🇷",
  Canada: "🇨🇦", "Cape Verde": "🇨🇻", Colombia: "🇨🇴", Croatia: "🇭🇷", "Curaçao": "🇨🇼", Czechia: "🇨🇿",
  "DR Congo": "🇨🇩", Ecuador: "🇪🇨", Egypt: "🇪🇬", England: "🏴", France: "🇫🇷", Germany: "🇩🇪",
  Ghana: "🇬🇭", Haiti: "🇭🇹", Iran: "🇮🇷", Iraq: "🇮🇶", "Ivory Coast": "🇨🇮", Japan: "🇯🇵",
  Jordan: "🇯🇴", Mexico: "🇲🇽", Morocco: "🇲🇦", Netherlands: "🇳🇱", "New Zealand": "🇳🇿", Norway: "🇳🇴",
  Panama: "🇵🇦", Paraguay: "🇵🇾", Portugal: "🇵🇹", Qatar: "🇶🇦", "Saudi Arabia": "🇸🇦", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Senegal: "🇸🇳", "South Africa": "🇿🇦", "South Korea": "🇰🇷", Spain: "🇪🇸", Sweden: "🇸🇪", Switzerland: "🇨🇭",
  Tunisia: "🇹🇳", Türkiye: "🇹🇷", "United States": "🇺🇸", Uruguay: "🇺🇾", Uzbekistan: "🇺🇿"
};

const aliases = new Map([
  ["usa", "United States"],
  ["united states", "United States"],
  ["korea republic", "South Korea"],
  ["south korea", "South Korea"],
  ["côte d'ivoire", "Ivory Coast"],
  ["cote d'ivoire", "Ivory Coast"],
  ["curacao", "Curaçao"],
  ["curaçao", "Curaçao"],
  ["turkey", "Türkiye"],
  ["türkiye", "Türkiye"],
  ["czech republic", "Czechia"],
  ["dr congo", "DR Congo"],
  ["congo dr", "DR Congo"],
  ["bosnia and herzegovina", "Bosnia & Herzegovina"]
]);

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
  advance_to_knockout_rounds: 3
};

const elements = {
  asOfLine: document.querySelector("#asOfLine"),
  standingsCards: document.querySelector("#standingsCards"),
  groupWinPoints: document.querySelector("#groupWinPoints"),
  advancePoints: document.querySelector("#advancePoints"),
  matchTickerTitle: document.querySelector("#matchTickerTitle"),
  todayMatches: document.querySelector("#todayMatches")
};

let participants = [];
let fixtures = [];
let teamState = { ...sampleTeams };
let dataGeneratedAt = null;

function boot() {
  participants = parseParticipants(participantsCsv);
  const generated = window.__WORLD_CUP_RESULTS__;
  if (generated?.fixtures?.length) {
    fixtures = generated.fixtures.filter((item) => `${item.fixture?.round || item.league?.round || ""}`.toLowerCase().includes("group"));
    teamState = buildStateFromFixtures(fixtures);
    applyGeneratedTeamStatus(teamState, generated.teamStatus);
    dataGeneratedAt = generated.generatedAt || null;
  }

  render();
}

function parseParticipants(csvText) {
  return csvText.trim().split(/\r?\n/).slice(1).reduce((pool, row) => {
    const [name, team] = row.split(",").map((part) => part.trim());
    if (!pool.some((entry) => entry.name === name)) pool.push({ name, teams: [] });
    pool.find((entry) => entry.name === name).teams.push(team);
    return pool;
  }, []);
}

function buildStateFromFixtures(items) {
  const state = {};
  participants.flatMap((participant) => participant.teams).forEach((team) => {
    state[team] = { wins: 0, draws: 0, losses: 0, status: "pending", advancement: "Possible" };
  });

  items.forEach((item) => {
    if (!["FT", "AET", "PEN"].includes(item.fixture?.status?.short)) return;
    const home = normalizeTeam(item.teams?.home?.name);
    const away = normalizeTeam(item.teams?.away?.name);
    const homeGoals = item.goals?.home;
    const awayGoals = item.goals?.away;
    if (!home || !away || homeGoals === null || awayGoals === null) return;
    ensureTeam(state, home);
    ensureTeam(state, away);
    if (homeGoals > awayGoals) {
      state[home].wins += 1;
      state[away].losses += 1;
    } else if (awayGoals > homeGoals) {
      state[away].wins += 1;
      state[home].losses += 1;
    } else {
      state[home].draws += 1;
      state[away].draws += 1;
    }
  });

  deriveAdvancement(state);
  return state;
}

function ensureTeam(state, team) {
  if (!state[team]) state[team] = { wins: 0, draws: 0, losses: 0, status: "pending", advancement: "Possible" };
}

function deriveAdvancement(state) {
  Object.values(state).forEach((record) => {
    const matches = record.wins + record.draws + record.losses;
    if (record.wins >= 2) {
      record.status = "qualified";
      record.advancement = "Very Likely";
    } else if (record.wins === 0 && record.losses >= 2) {
      record.status = "eliminated";
      record.advancement = "Out";
    } else if (matches >= 3 && record.wins === 0) {
      record.status = "eliminated";
      record.advancement = "Out";
    } else if (record.wins === 1 && record.draws >= 1) {
      record.advancement = "Likely";
    }
  });
}

function applyGeneratedTeamStatus(state, teamStatus) {
  if (!teamStatus) return;
  Object.entries(teamStatus).forEach(([team, status]) => {
    const normalizedTeam = normalizeTeam(team);
    if (!state[normalizedTeam] || !["qualified", "eliminated", "pending"].includes(status)) return;
    state[normalizedTeam].status = status;
    state[normalizedTeam].advancement = status === "qualified" ? "Very Likely" : status === "eliminated" ? "Out" : "Possible";
  });
}

function standings() {
  const rows = participants.map((participant) => {
    const groupWins = participant.teams.reduce((sum, team) => sum + (teamState[team]?.wins || 0), 0);
    const advancementBonus = participant.teams.filter((team) => teamState[team]?.status === "qualified").length * rules.advance_to_knockout_rounds;
    const points = groupWins * rules.group_stage_match_win + advancementBonus;
    const availableItems = availablePointsForParticipant(participant);
    const availablePoints = availableItems.reduce((sum, item) => sum + item.points, 0);
    return { ...participant, groupWins, advancementBonus, points, availableItems, availablePoints };
  });

  rows.sort((a, b) => b.points - a.points || b.availablePoints - a.availablePoints || b.groupWins - a.groupWins || a.name.localeCompare(b.name));
  let previous = null;
  rows.forEach((row, index) => {
    row.rank = previous && previous.points === row.points ? previous.rank : index + 1;
    previous = row;
  });
  rows.forEach((row) => {
    row.tieCount = rows.filter((entry) => entry.rank === row.rank).length;
  });
  return rows;
}

function availablePointsForParticipant(participant) {
  return participant.teams.map((team) => availablePointsForTeam(team)).filter((item) => item.points > 0).sort((a, b) => b.points - a.points || a.team.localeCompare(b.team));
}

function availablePointsForTeam(team) {
  const record = teamState[team] || { wins: 0, draws: 0, losses: 0, status: "pending" };
  const matchesPlayed = record.wins + record.draws + record.losses;
  const remainingMatches = Math.max(0, 3 - matchesPlayed);
  const groupPoints = remainingMatches * rules.group_stage_match_win;
  const advancementPoints = record.status === "pending" ? rules.advance_to_knockout_rounds : 0;
  const points = groupPoints + advancementPoints;
  const note = [remainingMatches ? `${remainingMatches} match${remainingMatches === 1 ? "" : "es"}` : "", advancementPoints ? "advancement" : ""].filter(Boolean).join(" + ");
  return { team, points, note };
}

function render() {
  elements.asOfLine.innerHTML = `<span>Through ${formatThroughDate()}</span><span>Updated ${formatUpdatedAt()}</span>`;
  elements.groupWinPoints.textContent = `${rules.group_stage_match_win} point`;
  elements.advancePoints.textContent = `${rules.advance_to_knockout_rounds} points`;
  elements.standingsCards.innerHTML = standings().map(renderPlayerCard).join("");
  renderMatchTicker();
}

function renderPlayerCard(row) {
  const rankLabel = row.tieCount > 1 ? `T-${row.rank}` : `${row.rank}`;
  const rankClass = row.rank === 1 ? "rank-1" : row.rank >= 10 ? "rank-red" : "";
  return `
    <article class="player-card">
      <div class="rank ${rankClass}">${rankLabel}</div>
      <div class="card-body">
        <div class="card-top">
          <div class="player-name">${row.name}</div>
          <div class="points">${row.points}<small>${row.groupWins} + ${row.advancementBonus}</small></div>
        </div>
        <div class="teams">${sortedTeamsByWins(row.teams).map(renderTeamRow).join("")}</div>
        <div class="available">${renderAvailable(row)}</div>
      </div>
    </article>
  `;
}

function renderTeamRow(team) {
  const record = teamState[team] || { wins: 0, draws: 0, losses: 0, status: "pending" };
  const glyph = record.status === "qualified" ? "✓" : record.status === "eliminated" ? "×" : "";
  const statusClass = record.status === "qualified" ? "qualified" : record.status === "eliminated" ? "eliminated" : "";
  return `
    <div class="team-row">
      <span class="flag">${flags[team] || "□"}</span>
      <span class="team-name">${team}</span>
      <span class="record">${record.wins}-${record.draws}-${record.losses}</span>
      <span class="status ${statusClass}">${glyph}</span>
    </div>
  `;
}

function renderAvailable(row) {
  if (!row.availableItems.length) return `<div class="available-total">0 possible</div>`;
  return `
    <div class="available-total">+${row.availablePoints} possible</div>
    ${row.availableItems.map((item) => `
      <div class="available-row">
        <span>${flags[item.team] || "□"}</span>
        <span>${item.team}</span>
        <strong>+${item.points}</strong>
        <small>${item.note}</small>
      </div>
    `).join("")}
  `;
}

function sortedTeamsByWins(teams) {
  return [...teams].sort((a, b) => {
    const first = teamState[a] || { wins: 0, draws: 0, losses: 0 };
    const second = teamState[b] || { wins: 0, draws: 0, losses: 0 };
    return second.wins - first.wins || second.draws - first.draws || first.losses - second.losses || a.localeCompare(b);
  });
}

function renderMatchTicker() {
  const upcoming = fixtures.filter((item) => !["FT", "AET", "PEN"].includes(item.fixture?.status?.short)).sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
  if (!upcoming.length) {
    elements.matchTickerTitle.textContent = "Next Group Matches";
    elements.todayMatches.textContent = "No upcoming group matches found.";
    return;
  }

  const todayKey = easternDateKey(new Date());
  const grouped = groupMatchesByEasternDate(upcoming);
  const titleDate = grouped[0].key === todayKey ? "Today" : formatEasternShortDate(grouped[0].matches[0].fixture.date);
  elements.matchTickerTitle.textContent = `Next Group Matches (${titleDate} +)`;
  elements.todayMatches.innerHTML = grouped.map((group) => `
    <section class="match-day">
      <h3>${group.key === todayKey ? "Today" : formatEasternShortDate(group.matches[0].fixture.date)}</h3>
      ${group.matches.map(renderTickerMatch).join("")}
    </section>
  `).join("");
}

function groupMatchesByEasternDate(matches) {
  const groups = [];
  matches.forEach((match) => {
    const key = easternDateKey(new Date(match.fixture.date));
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, matches: [] };
      groups.push(group);
    }
    group.matches.push(match);
  });
  return groups;
}

function renderTickerMatch(match) {
  const home = normalizeTeam(match.teams.home.name);
  const away = normalizeTeam(match.teams.away.name);
  return `
    <div class="ticker-match">
      <span class="flag-stack"><span>${flags[home] || "□"}</span><span>${flags[away] || "□"}</span></span>
      <span><b>${home} vs ${away}</b><small>${formatEasternTime(match.fixture.date)}</small></span>
    </div>
  `;
}

function formatThroughDate() {
  const completedDates = fixtures.filter((item) => ["FT", "AET", "PEN"].includes(item.fixture?.status?.short)).map((item) => new Date(item.fixture?.date)).filter((date) => !Number.isNaN(date.getTime()));
  const date = completedDates.length ? new Date(Math.max(...completedDates)) : new Date();
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "long", day: "numeric", year: "numeric" }).format(date);
}

function formatUpdatedAt() {
  if (!dataGeneratedAt) return "time unavailable";
  const date = new Date(dataGeneratedAt);
  if (Number.isNaN(date.getTime())) return "time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date);
}

function formatEasternTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBD";
  return `${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(date)} ET`;
}

function formatEasternShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric" }).format(date);
}

function easternDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function normalizeTeam(name = "") {
  const clean = name.trim();
  return aliases.get(clean.toLowerCase()) || clean;
}

boot();
