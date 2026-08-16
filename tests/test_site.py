#!/usr/bin/env python3
"""Static, accessibility, provenance, and Pages checks for the human desk."""

from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"SITE VALIDATION ERROR: {message}")


class ShellParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: list[str] = []
        self.inline_scripts = 0
        self.remote_runtime_assets: list[str] = []
        self.meta: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if values.get("id"):
            self.ids.append(values["id"])
        if tag == "script" and not values.get("src"):
            self.inline_scripts += 1
        if tag in {"script", "link"}:
            target = values.get("src") or values.get("href") or ""
            if target.startswith(("http://", "https://", "//")):
                self.remote_runtime_assets.append(target)
        if tag == "meta":
            self.meta.append(values)


required = [
    "index.html",
    "styles.css",
    "js/app.js",
    "data/context.bundle.js",
    "data/projection-manifest.json",
    "assets/icon.svg",
    "manifest.webmanifest",
    "sw.js",
    "robots.txt",
    "llms.txt",
    "ai-access-policy.json",
]
for rel in required:
    path = SITE / rel
    require(path.is_file() and path.stat().st_size > 0, f"missing or empty site file: {rel}")

index = (SITE / "index.html").read_text(encoding="utf-8")
parser = ShellParser()
parser.feed(index)
require(len(parser.ids) == len(set(parser.ids)), "HTML IDs must be unique")
require(parser.inline_scripts == 0, "inline scripts are forbidden by the CSP")
require(not parser.remote_runtime_assets, "remote runtime scripts/styles are forbidden")
require('class="skip-link"' in index, "skip link is required")
require('id="workspace"' in index, "main workspace landmark is required")
require("Content-Security-Policy" in index, "content security policy is required")
require("ai-access-policy.json" in index, "HTML must advertise the AI access policy")

robot_meta = next((item for item in parser.meta if item.get("name") == "robots"), {})
robot_tokens = {token.strip().lower() for token in robot_meta.get("content", "").split(",")}
for token in {"noindex", "nofollow", "noarchive", "nosnippet", "noai", "noimageai"}:
    require(token in robot_tokens, f"robots meta missing {token}")

robots = (SITE / "robots.txt").read_text(encoding="utf-8")
require(re.search(r"(?im)^User-agent:\s*\*$", robots) is not None, "robots.txt must address every crawler")
require(re.search(r"(?im)^Disallow:\s*/$", robots) is not None, "robots.txt must deny site-wide crawling")

policy = json.loads((SITE / "ai-access-policy.json").read_text(encoding="utf-8"))
for key in {
    "crawler_indexing",
    "model_training",
    "retrieval_augmented_generation_ingestion",
    "embedding_or_vectorisation",
    "automated_summarisation",
    "dataset_construction",
}:
    require(policy["automated_access"].get(key) == "denied", f"AI policy must deny {key}")
require("public GitHub Pages" in policy["confidentiality_warning"], "policy must not overclaim technical secrecy")

manifest = json.loads((SITE / "manifest.webmanifest").read_text(encoding="utf-8"))
require(manifest.get("display") == "standalone", "manifest must support app-style installation")
require(manifest.get("scope") == "./", "manifest scope must remain inside the Pages project")
require(str(manifest.get("start_url", "")).startswith("./"), "manifest start_url must be local")
require(all(not icon["src"].startswith(("http://", "https://")) for icon in manifest["icons"]), "manifest icons must be local")

app = (SITE / "js/app.js").read_text(encoding="utf-8")
for marker in [
    "SABINE_RESEARCH_DESK",
    "localStorage",
    "navigator.clipboard",
    "human-selected-sabine-research-brief",
    "ADJACENT",
    "serviceWorker.register",
    "prefers-color-scheme: dark",
]:
    require(marker in app, f"application missing required feature marker: {marker}")
require("fetch('http" not in app and 'fetch("http' not in app, "application must not send data to a remote runtime")

service_worker = (SITE / "sw.js").read_text(encoding="utf-8")
for rel in required:
    if rel == "sw.js":
        continue
    require(rel in service_worker, f"offline shell does not cache {rel}")
require("event.waitUntil(network.catch" in service_worker, "background refresh must stay alive")

workflow = (ROOT / ".github" / "workflows" / "pages.yml").read_text(encoding="utf-8")
for action in [
    "actions/checkout@v7",
    "actions/setup-node@v6",
    "actions/configure-pages@v6",
    "actions/upload-pages-artifact@v5",
    "actions/deploy-pages@v5",
]:
    require(action in workflow, f"Pages workflow missing {action}")
require("github.event.pull_request.head.sha || github.sha" in workflow, "validation must check out the exact stamped PR source")
require("python3 tools/build_site_data.py --check" in workflow, "workflow must reject stale generated data")
require("path: site" in workflow, "Pages artifact must contain only the human interface")

print("Sabine Research Desk 95 static, boundary, accessibility, and Pages checks: PASS")
