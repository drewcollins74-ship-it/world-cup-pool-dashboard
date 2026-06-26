#!/usr/bin/env python3
import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


API_BASE = "https://v3.football.api-sports.io/fixtures"
ROOT = Path(__file__).resolve().parent
RESULTS_JSON = ROOT / "data" / "results.json"
RESULTS_JS = ROOT / "src" / "latest-results.js"


def fetch_fixtures(api_key, league, season):
    query = urlencode({"league": league, "season": season})
    request = Request(f"{API_BASE}?{query}", headers={"x-apisports-key": api_key})

    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        message = [
            f"API-Football request failed: HTTP {error.code} {error.reason}",
            "",
            "Most common fixes:",
            "- Replace the placeholder with your real API-Football key.",
            "- Confirm the key is from api-football.com/API-Sports, not another football API provider.",
            "- Confirm your API-Football plan has access to fixtures for league=1 and season=2026.",
            "",
            f"API response: {body or '(empty)'}",
        ]
        raise SystemExit("\n".join(message)) from None


def write_outputs(payload, league, season):
    generated_at = datetime.now(timezone.utc).isoformat()
    output = {
        "generatedAt": generated_at,
        "source": "API-Football",
        "league": league,
        "season": season,
        "fixtures": payload.get("response", []),
        "api": {
            "results": payload.get("results"),
            "paging": payload.get("paging"),
            "errors": payload.get("errors"),
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


def readable_api_errors(errors):
    if not errors:
        return ""
    if isinstance(errors, str):
        return errors
    if isinstance(errors, list):
        return "; ".join(str(error) for error in errors)
    if isinstance(errors, dict):
        return "; ".join(f"{key}: {value}" for key, value in errors.items())
    return str(errors)


def main():
    parser = argparse.ArgumentParser(description="Fetch World Cup fixtures from API-Football for the pool dashboard.")
    parser.add_argument("--league", default=os.environ.get("API_FOOTBALL_LEAGUE", "1"))
    parser.add_argument("--season", default=os.environ.get("API_FOOTBALL_SEASON", "2026"))
    args = parser.parse_args()

    api_key = os.environ.get("API_FOOTBALL_KEY")
    if not api_key:
        raise SystemExit("Set API_FOOTBALL_KEY before running this updater.")
    if api_key.strip().lower() in {"your_key_here", "your-api-key", "api_key"}:
        raise SystemExit('Replace "your_key_here" with your real API-Football key, then run the command again.')

    payload = fetch_fixtures(api_key, args.league, args.season)
    output = write_outputs(payload, args.league, args.season)
    print(f"Wrote {len(output['fixtures'])} fixtures to {RESULTS_JSON}")
    print(f"Updated dashboard data script at {RESULTS_JS}")
    api_errors = readable_api_errors(output["api"].get("errors"))
    if api_errors:
        print(f"API-Football message: {api_errors}")


if __name__ == "__main__":
    main()
