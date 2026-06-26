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


def fetch_group_wikitexts():
    titles = "|".join(f"2026 FIFA World Cup Group {group}" for group in GROUPS)
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
    for block in re.findall(r"\{\{#invoke:football box\|main(?P<body>.*?)\n\}\}", wikitext, flags=re.S):
        team1 = team_from_field(block, "team1")
        team2 = team_from_field(block, "team2")
        if not team1 or not team2:
            continue

        home_goals, away_goals = parse_score(field_value(block, "score"))
        date = parse_datetime(field_value(block, "date"), field_value(block, "time"))
        status = "FT" if home_goals is not None and away_goals is not None else "NS"

        fixtures.append({
            "fixture": {
                "date": date,
                "status": {"short": status},
                "round": f"Group {group_letter}",
                "source": "Wikipedia",
            },
            "league": {
                "id": "wikipedia",
                "name": "FIFA World Cup",
                "season": 2026,
                "round": f"Group {group_letter}",
            },
            "teams": {
                "home": {"name": team1},
                "away": {"name": team2},
            },
            "goals": {
                "home": home_goals,
                "away": away_goals,
            },
        })
    return fixtures


def field_value(block, field):
    match = re.search(rf"^\|{re.escape(field)}\s*=\s*(.*?)(?=^\|[A-Za-z0-9_]+\s*=|\Z)", block, flags=re.M | re.S)
    return match.group(1).strip() if match else ""


def team_from_field(block, field):
    value = field_value(block, field)
    code_match = re.search(r"\|fb(?:-rt)?\|([A-Z0-9]{3})", value)
    if code_match:
        return TEAM_CODES.get(code_match.group(1), code_match.group(1))

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

    pages = fetch_group_wikitexts()

    for group in GROUPS:
        title = f"2026 FIFA World Cup Group {group}"
        wikitext = pages.get(title, "")
        if not wikitext:
            print(f"Warning: no Wikipedia content found for {title}")
            continue
        fixtures.extend(parse_matches(wikitext, group))
        team_status.update(parse_team_status(wikitext))

    output = write_outputs(fixtures, team_status)
    completed = sum(1 for fixture in fixtures if fixture["fixture"]["status"]["short"] == "FT")
    print(f"Wrote {len(output['fixtures'])} Wikipedia fixtures to {RESULTS_JSON}")
    print(f"Completed matches found: {completed}")
    print(f"Updated dashboard data script at {RESULTS_JS}")


if __name__ == "__main__":
    main()
