const sampleTeams = {
  France: { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Very Likely" },
  Colombia: { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Very Likely" },
  Sweden: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  "Cape Verde": { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  Netherlands: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  Switzerland: { wins: 2, draws: 1, losses: 0, status: "qualified", advancement: "Very Likely" },
  Paraguay: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  "Saudi Arabia": { wins: 0, draws: 2, losses: 0, status: "pending", advancement: "Possible" },
  Portugal: { wins: 1, draws: 0, losses: 1, status: "pending", advancement: "Possible" },
  Norway: { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Likely" },
  "Curaçao": { wins: 1, draws: 1, losses: 0, status: "eliminated", advancement: "Out" },
  Haiti: { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  England: { wins: 1, draws: 0, losses: 1, status: "pending", advancement: "Likely" },
  Morocco: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  "Ivory Coast": { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  Czechia: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  Brazil: { wins: 2, draws: 1, losses: 0, status: "qualified", advancement: "Very Likely" },
  Panama: { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  Egypt: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  Iraq: { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  Mexico: { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Likely" },
  Iran: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  "Bosnia & Herzegovina": { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Possible" },
  Jordan: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  Belgium: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  Japan: { wins: 1, draws: 0, losses: 1, status: "pending", advancement: "Possible" },
  Scotland: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Possible" },
  Qatar: { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  Spain: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Possible" },
  Ecuador: { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  "South Africa": { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  Ghana: { wins: 1, draws: 0, losses: 1, status: "pending", advancement: "Possible" },
  Canada: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Possible" },
  Croatia: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Possible" },
  Uzbekistan: { wins: 0, draws: 2, losses: 0, status: "eliminated", advancement: "Out" },
  Türkiye: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  Argentina: { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Very Likely" },
  Austria: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  Senegal: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  "New Zealand": { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  Germany: { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Very Likely" },
  Australia: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  Tunisia: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  "DR Congo": { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" },
  "United States": { wins: 2, draws: 0, losses: 0, status: "qualified", advancement: "Very Likely" },
  "South Korea": { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Likely" },
  Algeria: { wins: 1, draws: 1, losses: 0, status: "pending", advancement: "Possible" },
  Uruguay: { wins: 0, draws: 1, losses: 1, status: "pending", advancement: "Possible" }
};

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
  ["ivory coast", "Ivory Coast"],
  ["curacao", "Curaçao"],
  ["curaçao", "Curaçao"],
  ["turkey", "Türkiye"],
  ["türkiye", "Türkiye"],
  ["czech republic", "Czechia"],
  ["dr congo", "DR Congo"],
  ["congo dr", "DR Congo"],
  ["bosnia-herzegovina", "Bosnia & Herzegovina"],
  ["bosnia and herzegovina", "Bosnia & Herzegovina"]
]);

let participants = [];
let rules = {};
let teamState = { ...sampleTeams };
let fixtures = [];
let dataSource = "sample";
let dataGeneratedAt = null;
let generatedSourceName = "";

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

const rulesYaml = `pool_rules:
  group_stage_match_win:
    points: 1
  advance_to_knockout_rounds:
    points: 3
  round_of_32_victory:
    points: 5
  round_of_16_victory:
    points: 10
  quarterfinal_victory:
    points: 15
  semifinal_victory:
    points: 20
  third_place_match_winner:
    points: 10
  world_cup_winner:
    points: 30`;

const elements = {
  asOfLine: document.querySelector("#asOfLine"),
  standingsBody: document.querySelector("#standingsBody"),
  groupWinPoints: document.querySelector("#groupWinPoints"),
  advancePoints: document.querySelector("#advancePoints"),
  strongList: document.querySelector("#strongList"),
  matchTickerTitle: document.querySelector("#matchTickerTitle"),
  todayMatches: document.querySelector("#todayMatches")
};

async function boot() {
  participants = parseParticipants(participantsCsv);
  rules = parseRules(rulesYaml);
  loadGeneratedResults();
  render();

}

function parseParticipants(csvText) {
  const rows = csvText.trim().split(/\r?\n/).slice(1);
  return rows.reduce((pool, row) => {
    const [participant, team] = row.split(",").map((part) => part.trim());
    if (!pool.some((entry) => entry.name === participant)) {
      pool.push({ name: participant, teams: [] });
    }
    pool.find((entry) => entry.name === participant).teams.push(team);
    return pool;
  }, []);
}

function parseRules(yamlText) {
  let currentRule = null;
  return yamlText.split(/\r?\n/).reduce((parsed, line) => {
    const ruleMatch = line.match(/^\s{2}([a-z0-9_]+):\s*$/i);
    if (ruleMatch) currentRule = ruleMatch[1];
    const pointsMatch = line.match(/^\s{4}points:\s*(\d+)/i);
    if (currentRule && pointsMatch) parsed[currentRule] = Number(pointsMatch[1]);
    return parsed;
  }, {});
}

function loadGeneratedResults() {
  const generated = window.__WORLD_CUP_RESULTS__;
  if (!generated) return false;
  if (!generated.fixtures?.length) {
    return false;
  }

  fixtures = generated.fixtures.filter((item) => `${item.fixture?.round || item.league?.round || ""}`.toLowerCase().includes("group"));
  teamState = buildStateFromFixtures(fixtures);
  applyGeneratedTeamStatus(teamState, generated.teamStatus);
  dataSource = "generated";
  dataGeneratedAt = generated.generatedAt || null;
  generatedSourceName = generated.source || "results";
  return true;
}

function applyGeneratedTeamStatus(state, teamStatus) {
  if (!teamStatus) return;

  Object.entries(teamStatus).forEach(([team, status]) => {
    const normalizedTeam = normalizeTeam(team);
    if (!state[normalizedTeam]) return;
    if (!["qualified", "eliminated", "pending"].includes(status)) return;
    state[normalizedTeam].status = status;
    state[normalizedTeam].advancement = status === "qualified" ? "Very Likely" : status === "eliminated" ? "Out" : "Possible";
  });
}

function buildStateFromFixtures(apiFixtures) {
  const state = {};
  participants.flatMap((participant) => participant.teams).forEach((team) => {
    state[team] = { wins: 0, draws: 0, losses: 0, status: "pending", advancement: "Possible" };
  });

  apiFixtures.forEach((item) => {
    const home = normalizeTeam(item.teams?.home?.name);
    const away = normalizeTeam(item.teams?.away?.name);
    const shortStatus = item.fixture?.status?.short;
    const isComplete = ["FT", "AET", "PEN"].includes(shortStatus);
    if (!home || !away || !isComplete) return;

    const homeGoals = item.goals?.home;
    const awayGoals = item.goals?.away;
    if (homeGoals === null || awayGoals === null) return;

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
  if (!state[team]) {
    state[team] = { wins: 0, draws: 0, losses: 0, status: "pending", advancement: "Possible" };
  }
}

function deriveAdvancement(state) {
  Object.entries(state).forEach(([, record]) => {
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
    } else if (record.wins >= 2) {
      record.advancement = "Likely";
    } else if (record.wins === 1 && record.draws >= 1) {
      record.advancement = "Likely";
    } else {
      record.advancement = "Possible";
    }
  });
}

function normalizeTeam(name = "") {
  const clean = name.trim();
  return aliases.get(clean.toLowerCase()) || clean;
}

function standings() {
  const rows = participants.map((participant) => {
    const groupWins = participant.teams.reduce((sum, team) => sum + (teamState[team]?.wins || 0), 0);
    const advancementBonus = participant.teams.filter((team) => teamState[team]?.status === "qualified").length * (rules.advance_to_knockout_rounds || 3);
    const points = groupWins * (rules.group_stage_match_win || 1) + advancementBonus;
    return { ...participant, groupWins, advancementBonus, points };
  });

  rows.sort((a, b) => b.points - a.points || b.groupWins - a.groupWins || a.name.localeCompare(b.name));

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

function render() {
  elements.groupWinPoints.textContent = `${rules.group_stage_match_win || 1} point`;
  elements.advancePoints.textContent = `${rules.advance_to_knockout_rounds || 3} points`;
  elements.asOfLine.textContent = `Through ${formatThroughDate()} - ${dataSourceLabel()} - Updated ${formatUpdatedAt()}`;

  const rows = standings();
  elements.standingsBody.innerHTML = rows.map(renderStandingRow).join("");
  renderSidebar(rows);
  renderMatchTicker();
}

function renderStandingRow(row) {
  const rankLabel = row.tieCount > 1 ? `T-${row.rank}` : `${row.rank}`;
  const rankClass = row.rank === 1 ? "rank-1" : row.rank >= 10 ? "rank-red" : "";

  return `
    <tr class="${rankClass}">
      <td class="rank">${rankLabel}</td>
      <td class="player">${row.name}</td>
      <td class="points">${row.points}<small>(${row.groupWins} + ${row.advancementBonus})</small></td>
      <td>${sortedTeamsByWins(row.teams).map(renderTeamRecord).join("")}</td>
    </tr>
  `;
}

function renderTeamRecord(team) {
  const record = teamState[team] || { wins: 0, draws: 0, losses: 0, status: "pending" };
  const statusGlyph = record.status === "qualified" ? "✓" : record.status === "eliminated" ? "×" : "";
  const statusClass = record.status === "qualified" ? "qualified" : record.status === "eliminated" ? "eliminated" : "pending";
  return `
    <div class="team-row">
      <span class="flag">${flags[team] || "□"}</span>
      <span class="team-name">${team}</span>
      <span class="record">${record.wins}-${record.draws}-${record.losses}</span>
      <span class="status ${statusClass}">${statusGlyph}</span>
    </div>
  `;
}

function sortedTeamsByWins(teams) {
  return [...teams].sort((a, b) => {
    const first = teamState[a] || { wins: 0, draws: 0, losses: 0 };
    const second = teamState[b] || { wins: 0, draws: 0, losses: 0 };
    return second.wins - first.wins
      || second.draws - first.draws
      || first.losses - second.losses
      || a.localeCompare(b);
  });
}

function renderSidebar(rows) {
  const teamOwner = new Map();
  rows.forEach((row) => row.teams.forEach((team) => teamOwner.set(team, row.name)));

  const strong = Object.entries(teamState)
    .filter(([, record]) => record.status !== "qualified" && record.status !== "eliminated" && record.advancement === "Likely")
    .sort(([a], [b]) => a.localeCompare(b));

  elements.strongList.innerHTML = strong.slice(0, 8).map(([team]) => teamListItem(team, teamOwner)).join("");
}

function teamListItem(team, teamOwner) {
  return `<li><span class="flag">${flags[team] || "□"}</span><b>${team}</b> <em>(${teamOwner.get(team) || "unclaimed"})</em></li>`;
}

function renderMatchTicker() {
  const upcoming = fixtures
    .filter((item) => !["FT", "AET", "PEN"].includes(item.fixture?.status?.short))
    .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

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
  const completedDates = fixtures
    .filter((item) => ["FT", "AET", "PEN"].includes(item.fixture?.status?.short))
    .map((item) => new Date(item.fixture?.date))
    .filter((date) => !Number.isNaN(date.getTime()));
  const date = completedDates.length ? new Date(Math.max(...completedDates)) : dataGeneratedAt ? new Date(dataGeneratedAt) : new Date();
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

function formatEasternMatchTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";
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
  return `${new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit"
  }).format(date)} ET`;
}

function formatEasternShortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric"
  }).format(date);
}

function easternDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function dataSourceLabel() {
  if (dataSource === "generated") return `Automated ${generatedSourceName} results`;
  if (dataSource === "live") return "Live API-Football data";
  return "Sample data from attached image";
}

boot();
