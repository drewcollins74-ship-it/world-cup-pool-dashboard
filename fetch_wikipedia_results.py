#!/usr/bin/env python3
import json
import re
from html import unescape
from datetime import datetime, timezone
from datetime import timedelta
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
RESULTS_JSON = ROOT / "data" / "results.json"
RESULTS_JS = ROOT / "src" / "latest-results.js"
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
GROUPS = "ABCDEFGHIJKL"
KNOCKOUT_TITLE = "2026 FIFA World Cup knockout stage"
ROUND_OF_32_TITLE = "2026 FIFA World Cup round of 32"

TEAM_CODES = {
    "ALG": "Algeria",
    "ARG": "Argentina",
    "AUS": "Australia",
    "AUT": "Austria",
    "BEL": "Belgium",
    "BIH": "Bosnia & Herzegovina",
    "BRA": "Brazil",
    "CAN": "Canada",
    "CIV": "Ivory Coast",
    "COD": "DR Congo",
    "COL": "Colombia",
    "CPV": "Cape Verde",
    "CRO": "Croatia",
    "CUW": "Curaçao",
    "CZE": "Czechia",
    "ECU": "Ecuador",
    "EGY": "Egypt",
    "ENG": "England",
    "ESP": "Spain",
    "FRA": "France",
    "GER": "Germany",
    "GHA": "Ghana",
    "HAI": "Haiti",
    "IRN": "Iran",
    "IRQ": "Iraq",
    "JOR": "Jordan",
    "JPN": "Japan",
    "KOR": "South Korea",
    "KSA": "Saudi Arabia",
    "MAR": "Morocco",
    "MEX": "Mexico",
    "NED": "Netherlands",
    "NOR": "Norway",
    "NZL": "New Zealand",
    "PAN": "Panama",
    "PAR": "Paraguay",
    "POR": "Portugal",
    "QAT": "Qatar",
    "RSA": "South Africa",
    "SCO": "Scotland",
    "SEN": "Senegal",
    "SUI": "Switzerland",
    "SWE": "Sweden",
    "TUN": "Tunisia",
    "TUR": "Türkiye",
    "URU": "Uruguay",
    "USA": "United States",
    "UZB": "Uzbekistan",
}

NAME_ALIASES = {
    "Czech Republic": "Czechia",
    "South Korea": "South Korea",
    "United States": "United States",
    "Turkey": "Türkiye",
}


def fetch_wikitexts():
    titles = "|".join([
        *(f"2026 FIFA World Cup Group {group}" for group in GROUPS),
        KNOCKOUT_TITLE,
        ROUND_OF_32_TITLE,
    ])
    params = urlencode({
        "action": "query",
        "titles": titles,
        "prop": "revisions",
        "rvprop": "content",
        "rvslots": "main",
        "formatversion": "2",
        "format": "json",
    })
    request = Request(
        f"{WIKIPEDIA_API}?{params}",
        headers={"User-Agent": "WorldCupPoolDashboard/1.0 (local personal dashboard)"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise SystemExit(f"Wikipedia request failed: HTTP {error.code} {error.reason}\n{body}") from None

    if "error" in payload:
        raise RuntimeError(payload["error"].get("info", "Could not fetch group pages"))

    pages = {}
    for page in payload.get("query", {}).get("pages", []):
        title = page.get("title")
        content = page.get("revisions", [{}])[0].get("slots", {}).get("main", {}).get("content", "")
        if title and content:
            pages[title] = content
    return pages


def parse_matches(wikitext, group_letter):
    fixtures = []
    for block in football_box_blocks(wikitext):
        fixture = parse_fixture_block(block, f"Group {group_letter}")
        if fixture:
            fixtures.append(fixture)
    return fixtures


def parse_knockout_matches(wikitext):
    fixtures = []
    headings = list(re.finditer(
        r"^==\s*(Round of 32|Round of 16|Quarterfinals|Semifinals|Match for third place|Final)\s*==\s*$",
        wikitext,
        flags=re.M | re.I,
    ))
    round_names = {
        "round of 32": "Round of 32",
        "round of 16": "Round of 16",
        "quarterfinals": "Quarterfinals",
        "semifinals": "Semifinals",
        "match for third place": "Third Place",
        "final": "Final",
    }

    for index, heading in enumerate(headings):
        start = heading.end()
        end = headings[index + 1].start() if index + 1 < len(headings) else len(wikitext)
        round_name = round_names[heading.group(1).strip().lower()]
        for block in football_box_blocks(wikitext[start:end]):
            fixture = parse_fixture_block(block, round_name)
            if fixture:
                fixtures.append(fixture)
    return fixtures


def parse_round_page_matches(wikitext, round_name):
    fixtures = []
    for block in football_box_blocks(wikitext):
        fixture = parse_fixture_block(block, round_name)
        if fixture:
            fixtures.append(fixture)
    return fixtures


def football_box_blocks(wikitext):
    blocks = []
    start_pattern = re.compile(r"\{\{#invoke:\s*football box\s*\|\s*main", flags=re.I)
    position = 0

    while True:
        start_match = start_pattern.search(wikitext, position)
        if not start_match:
            break

        depth = 1
        cursor = start_match.end()
        while cursor < len(wikitext) and depth:
            if wikitext.startswith("{{", cursor):
                depth += 1
                cursor += 2
            elif wikitext.startswith("}}", cursor):
                depth -= 1
                if depth == 0:
                    blocks.append(wikitext[start_match.end():cursor])
                cursor += 2
            else:
                cursor += 1
        position = cursor

    return blocks


def parse_fixture_block(block, round_name):
    team1 = team_from_field(block, "team1")
    team2 = team_from_field(block, "team2")
    if not team1 or not team2:
        return None

    home_goals, away_goals = parse_score(field_value(block, "score"))
    date = parse_datetime(field_value(block, "date"), field_value(block, "time"))
    status = "FT" if home_goals is not None and away_goals is not None else "NS"
    winner = parse_winner(block, team1, team2, home_goals, away_goals)

    return {
        "fixture": {
            "date": date,
            "status": {"short": status},
            "round": round_name,
            "source": "Wikipedia",
            "winner": winner,
        },
        "league": {
            "id": "wikipedia",
            "name": "FIFA World Cup",
            "season": 2026,
            "round": round_name,
        },
        "teams": {
            "home": {"name": team1},
            "away": {"name": team2},
        },
        "goals": {
            "home": home_goals,
            "away": away_goals,
        },
    }


def parse_winner(block, team1, team2, home_goals, away_goals):
    if home_goals is None or away_goals is None:
        return None
    if home_goals > away_goals:
        return team1
    if away_goals > home_goals:
        return team2

    penalty_home, penalty_away = parse_score(field_value(block, "penaltyscore"))
    if penalty_home is None or penalty_away is None:
        return None
    return team1 if penalty_home > penalty_away else team2


def field_value(block, field):
    match = re.search(rf"^\|{re.escape(field)}\s*=\s*(.*?)(?=^\|[A-Za-z0-9_]+\s*=|\Z)", block, flags=re.M | re.S)
    return match.group(1).strip() if match else ""


def team_from_field(block, field):
    value = field_value(block, field)
    code_match = re.search(r"(?:\{\{|\|)fb(?:-rt)?\|([A-Z0-9]{3})", value, flags=re.I)
    if code_match:
        code = code_match.group(1).upper()
        return TEAM_CODES.get(code, code)

    clean = strip_markup(value)
    return normalize_name(clean)


def parse_score(value):
    clean = strip_markup(value).replace("–", "-").replace("—", "-")
    match = re.search(r"(\d+)\s*-\s*(\d+)", clean)
    if not match:
        return None, None
    return int(match.group(1)), int(match.group(2))


def parse_datetime(date_value, time_value):
    date_match = re.search(r"Start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})", date_value)
    if not date_match:
        return None

    year, month, day = map(int, date_match.groups())
    time_match = parse_time(time_value)
    if not time_match:
        return datetime(year, month, day, tzinfo=timezone.utc).isoformat()

    hour, minute, offset_hours, offset_minutes = time_match
    tz = timezone(timedelta(hours=offset_hours, minutes=offset_minutes))
    local_match_time = datetime(year, month, day, hour, minute, tzinfo=tz)
    return local_match_time.astimezone(timezone.utc).isoformat()


def parse_time(value):
    clean = strip_markup(unescape(value)).replace("\xa0", " ")
    time_match = re.search(r"(\d{1,2}):(\d{2})\s*([ap])\.?m\.?", clean, flags=re.I)
    offset_match = re.search(r"UTC\s*([+\-−])\s*(\d{1,2})(?::?(\d{2}))?", clean)
    if not time_match or not offset_match:
        return None

    hour = int(time_match.group(1))
    minute = int(time_match.group(2))
    meridiem = time_match.group(3).lower()
    if meridiem == "p" and hour != 12:
        hour += 12
    elif meridiem == "a" and hour == 12:
        hour = 0

    sign = -1 if offset_match.group(1) in {"-", "−"} else 1
    offset_hours = sign * int(offset_match.group(2))
    offset_minutes = sign * int(offset_match.group(3) or 0)
    return hour, minute, offset_hours, offset_minutes


def parse_date(value):
    match = re.search(r"Start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})", value)
    if not match:
        return None
    year, month, day = map(int, match.groups())
    return datetime(year, month, day, tzinfo=timezone.utc).isoformat()


def parse_team_status(wikitext):
    statuses = {}
    intro = wikitext.split("==Teams==", 1)[0]

    for sentence in re.split(r"(?<=[.!?])\s+", intro):
        names = [normalize_name(name) for name in re.findall(r"\[\[[^\]|]+ national [^\]|]+\|([^\]]+)\]\]", sentence)]
        if "advanced" in sentence:
            for name in names[:2]:
                statuses[name] = "qualified"
        if "remain in contention" in sentence or "remains in contention" in sentence:
            for name in names:
                statuses.setdefault(name, "pending")

    return statuses


def derive_team_status(fixtures):
    completed_statuses = {"FT", "AET", "PEN"}
    group_fixtures = {}
    all_group_teams = set()

    for fixture in fixtures:
        round_name = fixture.get("fixture", {}).get("round", "")
        if not round_name.startswith("Group "):
            continue
        group_fixtures.setdefault(round_name, []).append(fixture)
        all_group_teams.update({
            fixture["teams"]["home"]["name"],
            fixture["teams"]["away"]["name"],
        })

    statuses = {}
    third_place_records = []
    unresolved_third_slots = 0

    for group_name, matches in group_fixtures.items():
        if len(matches) != 6 or any(
            match.get("fixture", {}).get("status", {}).get("short") not in completed_statuses
            for match in matches
        ):
            unresolved_third_slots += 1
            continue

        ranked = rank_completed_group(matches)
        metric_counts = {}
        for record in ranked:
            metric_counts[record["rank_metrics"]] = metric_counts.get(record["rank_metrics"], 0) + 1

        for record in ranked:
            metrics = record["rank_metrics"]
            better_count = sum(count for key, count in metric_counts.items() if key < metrics)
            equal_count = metric_counts[metrics]
            if better_count + equal_count <= 2:
                statuses[record["team"]] = "qualified"
            elif better_count >= 3:
                statuses[record["team"]] = "eliminated"
            elif better_count == 2 and equal_count == 1:
                statuses[record["team"]] = "pending"
                third_place_records.append(record)
            else:
                statuses[record["team"]] = "pending"
                unresolved_third_slots += 1

    rank_third_place_teams(third_place_records, unresolved_third_slots, statuses)

    for fixture in fixtures:
        round_name = fixture.get("fixture", {}).get("round", "")
        if round_name.startswith("Group "):
            continue
        for side in ("home", "away"):
            team = fixture.get("teams", {}).get(side, {}).get("name")
            if team in all_group_teams:
                statuses[team] = "qualified"

    return statuses


def rank_completed_group(matches):
    teams = sorted({
        fixture["teams"][side]["name"]
        for fixture in matches
        for side in ("home", "away")
    })
    overall = {team: blank_standing(team) for team in teams}
    for fixture in matches:
        apply_standing_result(overall, fixture)

    ranked = []
    point_groups = {}
    for record in overall.values():
        point_groups.setdefault(record["points"], []).append(record)

    for points in sorted(point_groups, reverse=True):
        tied_records = point_groups[points]
        tied_teams = {record["team"] for record in tied_records}
        head_to_head = {team: blank_standing(team) for team in tied_teams}
        for fixture in matches:
            home = fixture["teams"]["home"]["name"]
            away = fixture["teams"]["away"]["name"]
            if home in tied_teams and away in tied_teams:
                apply_standing_result(head_to_head, fixture)

        for record in tied_records:
            mini = head_to_head[record["team"]]
            record["rank_metrics"] = (
                -record["points"],
                -mini["points"],
                -goal_difference(mini),
                -mini["goals_for"],
                -goal_difference(record),
                -record["goals_for"],
            )
        ranked.extend(sorted(tied_records, key=lambda record: (record["rank_metrics"], record["team"])))

    return ranked


def blank_standing(team):
    return {"team": team, "points": 0, "goals_for": 0, "goals_against": 0}


def apply_standing_result(standings, fixture):
    home = fixture["teams"]["home"]["name"]
    away = fixture["teams"]["away"]["name"]
    home_goals = fixture["goals"]["home"]
    away_goals = fixture["goals"]["away"]
    if home_goals is None or away_goals is None:
        return

    standings[home]["goals_for"] += home_goals
    standings[home]["goals_against"] += away_goals
    standings[away]["goals_for"] += away_goals
    standings[away]["goals_against"] += home_goals
    if home_goals > away_goals:
        standings[home]["points"] += 3
    elif away_goals > home_goals:
        standings[away]["points"] += 3
    else:
        standings[home]["points"] += 1
        standings[away]["points"] += 1


def goal_difference(record):
    return record["goals_for"] - record["goals_against"]


def rank_third_place_teams(records, unresolved_slots, statuses):
    metric_counts = {}
    for record in records:
        metrics = (
            -record["points"],
            -goal_difference(record),
            -record["goals_for"],
        )
        record["third_place_metrics"] = metrics
        metric_counts[metrics] = metric_counts.get(metrics, 0) + 1

    for record in records:
        metrics = record["third_place_metrics"]
        better_count = sum(count for key, count in metric_counts.items() if key < metrics)
        equal_count = metric_counts[metrics]
        if better_count + equal_count + unresolved_slots <= 8:
            statuses[record["team"]] = "qualified"
        elif better_count >= 8:
            statuses[record["team"]] = "eliminated"


def normalize_name(name):
    name = re.sub(r"\s+", " ", name).strip()
    return NAME_ALIASES.get(name, name)


def strip_markup(value):
    value = re.sub(r"\{\{score link\|[^|{}]+\|([^{}]+)\}\}", r"\1", value)
    value = re.sub(r"\{\{[^{}]*\}\}", "", value)
    value = re.sub(r"\[\[[^|\]]+\|([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"\[\[([^\]]+)\]\]", r"\1", value)
    value = re.sub(r"<[^>]+>", "", value)
    return value.strip()


def write_outputs(fixtures, team_status):
    generated_at = datetime.now(timezone.utc).isoformat()
    output = {
        "generatedAt": generated_at,
        "source": "Wikipedia",
        "sourceUrl": "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup",
        "league": "wikipedia",
        "season": "2026",
        "fixtures": fixtures,
        "teamStatus": team_status,
        "api": {
            "results": len(fixtures),
            "errors": None,
        },
    }

    RESULTS_JSON.parent.mkdir(parents=True, exist_ok=True)
    RESULTS_JS.parent.mkdir(parents=True, exist_ok=True)
    RESULTS_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    RESULTS_JS.write_text(
        "window.__WORLD_CUP_RESULTS__ = "
        + json.dumps(output, ensure_ascii=False)
        + ";\n",
        encoding="utf-8",
    )
    return output


def main():
    fixtures = []
    team_status = {}

    pages = fetch_wikitexts()

    for group in GROUPS:
        title = f"2026 FIFA World Cup Group {group}"
        wikitext = pages.get(title, "")
        if not wikitext:
            print(f"Warning: no Wikipedia content found for {title}")
            continue
        fixtures.extend(parse_matches(wikitext, group))
        team_status.update(parse_team_status(wikitext))

    knockout_wikitext = pages.get(KNOCKOUT_TITLE, "")
    if knockout_wikitext:
        knockout_fixtures = [
            fixture
            for fixture in parse_knockout_matches(knockout_wikitext)
            if fixture["fixture"]["round"] != "Round of 32"
        ]
        fixtures.extend(knockout_fixtures)
        if not knockout_fixtures:
            print(f"Warning: no knockout fixtures parsed from {KNOCKOUT_TITLE}")
    else:
        print(f"Warning: no Wikipedia content found for {KNOCKOUT_TITLE}")

    round_of_32_wikitext = pages.get(ROUND_OF_32_TITLE, "")
    if round_of_32_wikitext:
        round_of_32_fixtures = parse_round_page_matches(round_of_32_wikitext, "Round of 32")
        fixtures.extend(round_of_32_fixtures)
        if len(round_of_32_fixtures) != 16:
            print(
                f"Warning: expected 16 Round of 32 fixtures from {ROUND_OF_32_TITLE}, "
                f"found {len(round_of_32_fixtures)}"
            )
    else:
        print(f"Warning: no Wikipedia content found for {ROUND_OF_32_TITLE}")

    team_status.update(derive_team_status(fixtures))
    output = write_outputs(fixtures, team_status)
    completed = sum(1 for fixture in fixtures if fixture["fixture"]["status"]["short"] == "FT")
    print(f"Wrote {len(output['fixtures'])} Wikipedia fixtures to {RESULTS_JSON}")
    print(f"Completed matches found: {completed}")
    print(f"Updated dashboard data script at {RESULTS_JS}")


if __name__ == "__main__":
    main()
