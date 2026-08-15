#!/usr/bin/env python3
"""Validate the public-only sabine-gpt context graph without network access."""

from __future__ import annotations

import json
import re
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

ARXIV_VERSION_RE = re.compile(r"^v[1-9][0-9]*$")


def load_json(rel: str):
    with (ROOT / rel).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"VALIDATION ERROR: {message}")


def main() -> None:
    for rel in REQUIRED:
        require((ROOT / rel).is_file(), f"missing required file: {rel}")

    # Parse every .json document in the repository.
    json_paths = sorted(ROOT.rglob("*.json"))
    for path in json_paths:
        with path.open("r", encoding="utf-8") as handle:
            json.load(handle)

    # README4AI.md is intentionally a one-line JSON machine pointer despite its
    # Markdown extension, so validate it explicitly rather than by file suffix.
    machine_pointer = load_json("README4AI.md")
    require(
        machine_pointer.get("canonical_machine_entrypoint") == "ai/bootstrap.json",
        "README4AI.md must point to ai/bootstrap.json",
    )
    require(machine_pointer.get("visibility") == "public", "README4AI.md must declare public visibility")

    bootstrap = load_json("ai/bootstrap.json")
    for rel in bootstrap["load_order"]:
        require((ROOT / rel).is_file(), f"bootstrap target does not exist: {rel}")
    require(isinstance(bootstrap.get("routed_records"), dict), "bootstrap routed_records must be an object")
    for route, records in bootstrap["routed_records"].items():
        require(isinstance(records, list), f"bootstrap route must be a list: {route}")
        for rel in records:
            require((ROOT / rel).is_file(), f"routed bootstrap target does not exist: {route} -> {rel}")

    source_policy = load_json("ai/source-policy.json")
    require(source_policy["publication_model"] == "explicit_public_only", "public-only policy must remain explicit")
    require("private_qsol_context_records" in source_policy["forbidden_evidence"], "private QSOL context must remain forbidden")
    allowed_source_classes = set(source_policy["allowed_source_classes"])

    source_doc = load_json("sources/public-sources.json")
    require(source_doc.get("visibility") == "public", "source registry must declare public visibility")
    source_ids = [item["id"] for item in source_doc["sources"]]
    require(len(source_ids) == len(set(source_ids)), "duplicate source id")
    source_id_set = set(source_ids)
    source_by_id = {item["id"]: item for item in source_doc["sources"]}

    for item in source_doc["sources"]:
        require(item.get("visibility") == "public", f"source must declare public visibility: {item['id']}")
        require(item.get("class") in allowed_source_classes, f"source class is not allowed: {item['id']} -> {item.get('class')}")
        require(item.get("url", "").startswith("https://"), f"non-HTTPS source: {item['id']}")
        if item["id"].startswith("paper."):
            version = item.get("arxiv_version")
            require(isinstance(version, str) and ARXIV_VERSION_RE.fullmatch(version), f"paper source missing valid arXiv version: {item['id']}")
            arxiv_id = item["id"].removeprefix("paper.")
            expected_url = f"https://arxiv.org/abs/{arxiv_id}{version}"
            require(item.get("url") == expected_url, f"paper source URL is not pinned to exact arXiv revision: {item['id']}")

    publications = load_json("publications/index.json")["publications"]
    publication_ids = [item["id"] for item in publications]
    require(len(publication_ids) == len(set(publication_ids)), "duplicate publication id")
    publication_id_set = set(publication_ids)
    require(publication_id_set <= source_id_set, "every publication must resolve to a public source registry id")

    for item in publications:
        version = item.get("arxiv_version")
        require(isinstance(version, str) and ARXIV_VERSION_RE.fullmatch(version), f"publication missing valid arXiv version: {item['id']}")
        expected_url = f"https://arxiv.org/abs/{item['arxiv']}{version}"
        require(item.get("url") == expected_url, f"publication URL is not pinned to exact arXiv revision: {item['id']}")
        source = source_by_id[item["id"]]
        require(source.get("arxiv_version") == version, f"publication/source arXiv version mismatch: {item['id']}")
        require(source.get("url") == item.get("url"), f"publication/source URL mismatch: {item['id']}")

    epistemic_states = set(load_json("ai/epistemic-contract.json")["states"])
    profile = load_json("profiles/sabine-public.json")
    for claim in profile["claims"]:
        state = claim.get("epistemic_state")
        require(state in epistemic_states, f"profile claim uses undefined epistemic state: {state}")
        require(state != "retrieved", "static profile claims must not persist task-local retrieved state")
        for source_id in claim["sources"]:
            require(source_id in source_id_set, f"profile claim has dangling source: {source_id}")

    focus = load_json("research/current-focus.json")
    for source_id in focus["basis"]:
        require(source_id in source_id_set, f"focus basis has dangling source: {source_id}")
    for area in focus["focus_areas"]:
        for paper_id in area["papers"]:
            require(paper_id in publication_id_set, f"focus area has dangling publication: {paper_id}")

    print(
        "sabine-gpt context valid: "
        f"{len(json_paths)} JSON files + README4AI machine pointer, "
        f"{len(source_ids)} public sources, "
        f"{len(publication_ids)} selected publications"
    )


if __name__ == "__main__":
    main()
