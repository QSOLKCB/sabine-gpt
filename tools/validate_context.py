#!/usr/bin/env python3
"""Validate the public-only sabine-gpt context graph without network access."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md",
    "README4AI.md",
    "AGENTS.md",
    "ai/bootstrap.json",
    "ai/source-policy.json",
    "ai/epistemic-contract.json",
    "ai/math-research-contract.json",
    "ai/retrieval-policy.json",
    "ai/persona-boundary.json",
    "sources/public-sources.json",
    "profiles/sabine-public.json",
    "research/current-focus.json",
    "publications/index.json",
]


def load_json(rel: str):
    with (ROOT / rel).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"VALIDATION ERROR: {message}")


def main() -> None:
    for rel in REQUIRED:
        require((ROOT / rel).is_file(), f"missing required file: {rel}")

    # Parse every JSON document in the repository.
    json_paths = sorted(ROOT.rglob("*.json"))
    for path in json_paths:
        with path.open("r", encoding="utf-8") as handle:
            json.load(handle)

    bootstrap = load_json("ai/bootstrap.json")
    for rel in bootstrap["load_order"]:
        require((ROOT / rel).is_file(), f"bootstrap target does not exist: {rel}")

    source_doc = load_json("sources/public-sources.json")
    source_ids = [item["id"] for item in source_doc["sources"]]
    require(len(source_ids) == len(set(source_ids)), "duplicate source id")
    source_id_set = set(source_ids)

    for item in source_doc["sources"]:
        require(item.get("url", "").startswith("https://"), f"non-HTTPS source: {item['id']}")

    publications = load_json("publications/index.json")["publications"]
    publication_ids = [item["id"] for item in publications]
    require(len(publication_ids) == len(set(publication_ids)), "duplicate publication id")
    publication_id_set = set(publication_ids)
    require(publication_id_set <= source_id_set, "every publication must resolve to a public source registry id")

    profile = load_json("profiles/sabine-public.json")
    for claim in profile["claims"]:
        for source_id in claim["sources"]:
            require(source_id in source_id_set, f"profile claim has dangling source: {source_id}")

    focus = load_json("research/current-focus.json")
    for source_id in focus["basis"]:
        require(source_id in source_id_set, f"focus basis has dangling source: {source_id}")
    for area in focus["focus_areas"]:
        for paper_id in area["papers"]:
            require(paper_id in publication_id_set, f"focus area has dangling publication: {paper_id}")

    source_policy = load_json("ai/source-policy.json")
    require(source_policy["publication_model"] == "explicit_public_only", "public-only policy must remain explicit")
    require("private_qsol_context_records" in source_policy["forbidden_evidence"], "private QSOL context must remain forbidden")

    print(
        "sabine-gpt context valid: "
        f"{len(json_paths)} JSON files, "
        f"{len(source_ids)} public sources, "
        f"{len(publication_ids)} selected publications"
    )


if __name__ == "__main__":
    main()
