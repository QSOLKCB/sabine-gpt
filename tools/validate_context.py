#!/usr/bin/env python3
"""Validate the public-only sabine-gpt context graph without network access."""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
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
ARXIV_SOURCE_CLASSES = {"arxiv", "journal_and_arxiv"}
ARXIV_URL_PREFIX = "https://arxiv.org/abs/"
PROVENANCE_REGISTRY = "sources/public-sources.json"
PROVENANCE_DEPENDENT_RECORDS = {
    "profiles/sabine-public.json",
    "research/current-focus.json",
    "publications/index.json",
}


def reject_non_json_constant(value: str) -> None:
    raise ValueError(f"non-JSON numeric constant: {value}")


def load_json_path(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle, parse_constant=reject_non_json_constant)


def load_json(rel: str):
    return load_json_path(ROOT / rel)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"VALIDATION ERROR: {message}")


def require_timestamp_date(doc: dict, date_key: str, timestamp_key: str, label: str) -> None:
    date_value = doc.get(date_key)
    timestamp_value = doc.get(timestamp_key)
    require(isinstance(date_value, str), f"{label} missing {date_key}")
    require(isinstance(timestamp_value, str), f"{label} missing {timestamp_key}")
    try:
        parsed = datetime.fromisoformat(timestamp_value)
    except ValueError as exc:
        raise SystemExit(f"VALIDATION ERROR: {label} has invalid {timestamp_key}: {exc}") from exc
    require(parsed.tzinfo is not None, f"{label} {timestamp_key} must include an explicit UTC offset")
    require(parsed.date().isoformat() == date_value, f"{label} {date_key} does not match {timestamp_key}")
    now = datetime.now(timezone.utc)
    require(parsed.astimezone(timezone.utc) <= now + timedelta(minutes=10), f"{label} verification timestamp is in the future")


def validate_routes(routes: dict, label: str) -> None:
    """Validate route targets and fail closed if cached claims lack provenance."""
    require(isinstance(routes, dict), f"{label} routing must be an object")
    for route, records in routes.items():
        require(isinstance(records, list), f"{label} route must be a list: {route}")
        for rel in records:
            require((ROOT / rel).is_file(), f"{label} target does not exist: {route} -> {rel}")

        if PROVENANCE_DEPENDENT_RECORDS.intersection(records):
            require(
                PROVENANCE_REGISTRY in records,
                f"{label} route loads cached claims without provenance registry: {route}",
            )


def main() -> None:
    for rel in REQUIRED:
        require((ROOT / rel).is_file(), f"missing required file: {rel}")

    # Parse every .json document using strict JSON semantics. Python normally
    # accepts NaN/Infinity extensions; parse_constant rejects them so records
    # remain portable to strict consumers such as JSON.parse.
    json_paths = sorted(ROOT.rglob("*.json"))
    for path in json_paths:
        load_json_path(path)

    # README4AI.md is intentionally a one-line JSON machine pointer despite its
    # Markdown extension, so validate it explicitly rather than by file suffix.
    machine_pointer = load_json("README4AI.md")
    require(
        machine_pointer.get("canonical_machine_entrypoint") == "ai/bootstrap.json",
        "README4AI.md must point to ai/bootstrap.json",
    )
    require(machine_pointer.get("visibility") == "public", "README4AI.md must declare public visibility")

    bootstrap = load_json("ai/bootstrap.json")
    require_timestamp_date(bootstrap, "snapshot_date", "snapshot_timestamp", "bootstrap")
    for rel in bootstrap["load_order"]:
        require((ROOT / rel).is_file(), f"bootstrap target does not exist: {rel}")
    validate_routes(bootstrap.get("routed_records"), "bootstrap")

    retrieval_policy = load_json("ai/retrieval-policy.json")
    validate_routes(retrieval_policy.get("routing"), "retrieval-policy")
    for route, records in retrieval_policy["routing"].items():
        if route in bootstrap["routed_records"]:
            require(
                records == bootstrap["routed_records"][route],
                f"routing mismatch between bootstrap and retrieval policy: {route}",
            )

    source_policy = load_json("ai/source-policy.json")
    require(source_policy["publication_model"] == "explicit_public_only", "public-only policy must remain explicit")
    require("private_qsol_context_records" in source_policy["forbidden_evidence"], "private QSOL context must remain forbidden")
    allowed_source_classes = set(source_policy["allowed_source_classes"])

    source_doc = load_json("sources/public-sources.json")
    require_timestamp_date(source_doc, "snapshot_date", "snapshot_timestamp", "source registry")
    require(source_doc.get("visibility") == "public", "source registry must declare public visibility")
    source_ids = [item["id"] for item in source_doc["sources"]]
    require(len(source_ids) == len(set(source_ids)), "duplicate source id")
    source_id_set = set(source_ids)
    source_by_id = {item["id"]: item for item in source_doc["sources"]}

    for item in source_doc["sources"]:
        source_id = item["id"]
        source_class = item.get("class")
        require(item.get("visibility") == "public", f"source must declare public visibility: {source_id}")
        require(source_class in allowed_source_classes, f"source class is not allowed: {source_id} -> {source_class}")
        require(item.get("url", "").startswith("https://"), f"non-HTTPS source: {source_id}")

        if source_class in ARXIV_SOURCE_CLASSES:
            arxiv_id = item.get("arxiv")
            version = item.get("arxiv_version")
            require(isinstance(arxiv_id, str) and arxiv_id, f"arXiv-class source missing arxiv id: {source_id}")
            require(isinstance(version, str) and ARXIV_VERSION_RE.fullmatch(version), f"arXiv-class source missing valid version: {source_id}")
            expected_url = f"{ARXIV_URL_PREFIX}{arxiv_id}{version}"
            require(item.get("url") == expected_url, f"arXiv-class source URL is not pinned to exact revision: {source_id}")
        else:
            require("arxiv" not in item and "arxiv_version" not in item, f"non-arXiv source carries arXiv metadata without an arXiv source class: {source_id}")

    epistemic_states = set(load_json("ai/epistemic-contract.json")["states"])

    publication_doc = load_json("publications/index.json")
    require_timestamp_date(publication_doc, "snapshot_date", "snapshot_timestamp", "publication index")
    publications = publication_doc["publications"]
    publication_ids = [item["id"] for item in publications]
    require(len(publication_ids) == len(set(publication_ids)), "duplicate publication id")
    publication_id_set = set(publication_ids)
    require(publication_id_set <= source_id_set, "every publication must resolve to a public source registry id")

    for item in publications:
        publication_id = item["id"]
        source = source_by_id[publication_id]
        source_is_arxiv = source.get("class") in ARXIV_SOURCE_CLASSES
        publication_url = item.get("url")
        publication_has_arxiv_metadata = (
            "arxiv" in item
            or "arxiv_version" in item
            or (isinstance(publication_url, str) and publication_url.startswith(ARXIV_URL_PREFIX))
        )

        state = item.get("epistemic_state")
        require(state in epistemic_states, f"publication uses undefined epistemic state: {publication_id} -> {state}")
        require(state == "cached_public_record", f"static publication summary must be cached_public_record: {publication_id}")

        # Validate publication-side arXiv claims because they are claims in their
        # own right. Do not let a later source-class edit disable these checks.
        if publication_has_arxiv_metadata:
            require(
                source_is_arxiv,
                f"publication carries arXiv metadata but backing source is not arXiv-class: {publication_id}",
            )
            arxiv_id = item.get("arxiv")
            version = item.get("arxiv_version")
            require(isinstance(arxiv_id, str) and arxiv_id, f"publication missing arxiv id: {publication_id}")
            require(isinstance(version, str) and ARXIV_VERSION_RE.fullmatch(version), f"publication missing valid arXiv version: {publication_id}")
            expected_url = f"{ARXIV_URL_PREFIX}{arxiv_id}{version}"
            require(publication_url == expected_url, f"publication URL is not pinned to exact arXiv revision: {publication_id}")
            require(source.get("arxiv") == arxiv_id, f"publication/source arXiv id mismatch: {publication_id}")
            require(source.get("arxiv_version") == version, f"publication/source arXiv version mismatch: {publication_id}")
        else:
            require(
                not source_is_arxiv,
                f"arXiv-backed publication is missing publication-side arXiv metadata: {publication_id}",
            )

        require(source.get("url") == publication_url, f"publication/source URL mismatch: {publication_id}")

    profile = load_json("profiles/sabine-public.json")
    require_timestamp_date(profile, "last_verified", "last_verified_at", "Sabine public profile")
    for claim in profile["claims"]:
        state = claim.get("epistemic_state")
        require(state in epistemic_states, f"profile claim uses undefined epistemic state: {state}")
        require(state != "retrieved", "static profile claims must not persist task-local retrieved state")
        for source_id in claim["sources"]:
            require(source_id in source_id_set, f"profile claim has dangling source: {source_id}")

    focus = load_json("research/current-focus.json")
    require_timestamp_date(focus, "snapshot_date", "snapshot_timestamp", "current-focus record")
    require_timestamp_date(focus, "last_verified", "last_verified_at", "current-focus verification")
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
