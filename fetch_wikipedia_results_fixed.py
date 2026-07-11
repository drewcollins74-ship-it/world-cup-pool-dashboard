#!/usr/bin/env python3
"""Run the World Cup results fetcher with more resilient knockout headings.

Wikipedia occasionally changes the wording or heading level used for knockout
rounds. This wrapper keeps the original fetcher intact while replacing only the
section parser so a third-place match cannot bleed into the semifinal section.
"""

import re

import fetch_wikipedia_results as base


ROUND_ALIASES = {
    "round of 32": "Round of 32",
    "round of 16": "Round of 16",
    "quarterfinals": "Quarterfinals",
    "quarter-finals": "Quarterfinals",
    "semifinals": "Semifinals",
    "semi-finals": "Semifinals",
    "match for third place": "Third Place",
    "third place play-off": "Third Place",
    "third-place play-off": "Third Place",
    "third place playoff": "Third Place",
    "third-place playoff": "Third Place",
    "final": "Final",
}


def normalize_heading(value):
    value = re.sub(r"<!--.*?-->", "", value, flags=re.S)
    value = value.replace("–", "-").replace("—", "-")
    return re.sub(r"\s+", " ", value).strip().lower()


def parse_knockout_matches(wikitext):
    fixtures = []
    headings = []

    for match in re.finditer(r"^(={2,6})\s*(.*?)\s*\1\s*$", wikitext, flags=re.M):
        headings.append(
            {
                "start": match.start(),
                "end": match.end(),
                "level": len(match.group(1)),
                "title": normalize_heading(match.group(2)),
            }
        )

    for index, heading in enumerate(headings):
        round_name = ROUND_ALIASES.get(heading["title"])
        if not round_name:
            continue

        section_end = len(wikitext)
        for following in headings[index + 1 :]:
            if following["level"] <= heading["level"]:
                section_end = following["start"]
                break

        section = wikitext[heading["end"] : section_end]
        for block in base.football_box_blocks(section):
            fixture = base.parse_fixture_block(block, round_name)
            if fixture:
                fixtures.append(fixture)

    return fixtures


base.parse_knockout_matches = parse_knockout_matches


if __name__ == "__main__":
    base.main()
