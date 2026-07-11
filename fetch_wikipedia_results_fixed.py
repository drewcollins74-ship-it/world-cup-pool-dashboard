#!/usr/bin/env python3
"""Run the Wikipedia results fetcher with more resilient knockout headings."""

import re

import fetch_wikipedia_results as results


ROUND_ALIASES = {
    "round of 32": "Round of 32",
    "round of 16": "Round of 16",
    "quarterfinals": "Quarterfinals",
    "quarter-finals": "Quarterfinals",
    "quarter finals": "Quarterfinals",
    "semifinals": "Semifinals",
    "semi-finals": "Semifinals",
    "semi finals": "Semifinals",
    "match for third place": "Third Place",
    "third place": "Third Place",
    "third-place play-off": "Third Place",
    "third place play-off": "Third Place",
    "third-place playoff": "Third Place",
    "third place playoff": "Third Place",
    "final": "Final",
}


def parse_knockout_matches(wikitext):
    """Parse knockout fixtures while tolerating Wikipedia heading variations."""
    heading_pattern = re.compile(
        r"^(?P<marks>={2,6})\s*(?P<title>"
        + "|".join(re.escape(title) for title in ROUND_ALIASES)
        + r")\s*(?P=marks)\s*$",
        flags=re.M | re.I,
    )
    headings = list(heading_pattern.finditer(wikitext))
    fixtures = []

    for index, heading in enumerate(headings):
        start = heading.end()
        end = headings[index + 1].start() if index + 1 < len(headings) else len(wikitext)
        round_name = ROUND_ALIASES[heading.group("title").strip().lower()]
        for block in results.football_box_blocks(wikitext[start:end]):
            fixture = results.parse_fixture_block(block, round_name)
            if fixture:
                fixtures.append(fixture)

    return fixtures


results.parse_knockout_matches = parse_knockout_matches
results.main()
