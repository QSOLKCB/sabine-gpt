# Sabine Research Desk 95 + sabine-gpt

An unofficial, public-source-only research desk and evidence-first context pack for mathematics and foundations-of-physics work.

> **Unofficial and independent.** This repository is not authored, endorsed, or maintained by Sabine Hossenfelder or OpenAI. It contains public metadata, links, and original summaries—not private context, paper text, or a personality clone.

## Open the research desk

### [Launch Sabine Research Desk 95 →](https://qsolkcb.github.io/sabine-gpt/)

That link is the normal way to use the project. No cloning, terminal, Python, JSON, GitHub account, or programming knowledge is required.

If the link has not activated yet, the repository owner must make the one-time selection **Settings → Pages → Build and deployment → GitHub Actions**, then merge the Pages pull request.

## One-minute guide

| Choose | To do this |
|---|---|
| **Work** | See the source-attributed public research snapshot. |
| **Papers** | Browse selected papers, exact arXiv revisions, DOI metadata, and short orientation summaries. |
| **Atlas** | Visually navigate the explicit paper-to-theme links. |
| **Brief** | Select a question, constraints, and the smallest relevant paper set; then copy or download the packet. |
| **Sources** | Inspect the public evidence and deterministic projection receipt. |
| **Help** | Read the independence, privacy, copyright, and automated-access boundaries. |

Favourites, reviewed-paper marks, and brief selections stay in the current browser. The desk has no account, ads, telemetry, analytics, CDN, remote application server, or third-party runtime dependency. It works offline after a successful first visit in a supporting browser.

See [START-HERE.md](START-HERE.md) for the short standalone guide.

## What is currently organised

The snapshot verified on **16 August 2026** groups selected public work into four themes:

1. locality, Bell assumptions, and statistical independence;
2. the measurement problem and physical wavefunction collapse;
3. superdeterminism, fine-tuning, overfitting, and testability;
4. quantum gravity and local collapse.

The selected shelf currently contains eight public paper records. It is intentionally **selective, not exhaustive**. “Current” means only what the cited public pages and dated repository snapshot support; it does not claim knowledge of private plans or unpublished work.

## Why it remains inspectable

The canonical public records remain the source of truth:

```text
profiles/sabine-public.json
research/current-focus.json
publications/index.json
sources/public-sources.json
```

The Pages data file is a deterministic human-interface projection produced by `tools/build_site_data.py`. Its projection manifest records:

- every canonical input path and SHA-256;
- one canonical input fingerprint;
- generator path and SHA-256;
- generated bundle path and SHA-256;
- `authority: projection_only`.

The generated site bundle is never edited as knowledge and never becomes canonical. Identical canonical bytes and generator bytes produce identical projection artifacts; no build timestamp or environment-specific path is embedded.

This follows the QSOL-SUBSTRATE principle:

> A substrate should become more portable, more compact, and more useful without becoming less inspectable or less trustworthy.

## Research discipline

The context pack is designed to stop pretending when evidence runs out. It requires a research assistant to:

- separate **proved**, **derived**, **retrieved**, **cached public record**, **inferred**, **working hypothesis**, **candidate proof**, **numerically supported**, **unknown**, **conflict**, and **refuted** states;
- state assumptions and check theorem hypotheses;
- preserve exact paper/version identifiers;
- verify time-sensitive literature status against live primary sources;
- search for counterexamples and materially different approaches before declaring impossibility;
- call an unchecked proof-like argument a **candidate proof**;
- say **“I don't know yet”** when the available evidence is insufficient;
- keep epistemic status separate from humour, register, or presentation style;
- enforce `ADJACENT_TRUTH != INHERITED_TRUTH`: every substantive claim earns support from its own evidence.

## Human interface versus AI context

The Pages interface under `site/**` is human-facing. It declares automated crawler indexing, model training, embedding, RAG ingestion, dataset construction, and automated summarisation denied. A person can deliberately export a small packet through the **Brief** screen.

GitHub Pages is public. `robots.txt`, page metadata, `llms.txt`, and the machine-readable access policy are deterrence and policy signals for compliant systems—not authentication, encryption, or secrecy. Confidential information must never be committed here.

AI consumers deliberately given the repository by a human begin with:

```text
README4AI.md
ai/bootstrap.json
```

They follow the canonical machine contracts and must not load `site/**` as evidence or context. See [HUMAN-INTERFACE-POLICY.md](HUMAN-INTERFACE-POLICY.md).

## Public-only boundary

Every canonical biographical or research claim must resolve to a public source. Forbidden evidence includes:

- private QSOL-CONTEXT records;
- private correspondence or nonpublic documents;
- credentials, leaks, or stolen material;
- unsupported personal inference;
- model memory alone for a time-sensitive claim.

Absence means **unknown or not loaded**, not false. A genuine source does not establish every claim adjacent to it. Current primary evidence overrides stale cached context.

## For maintainers

Update canonical records first, then regenerate and validate the projection:

```sh
python3 tools/build_site_data.py
python3 tools/validate_context.py
python3 tools/build_site_data.py --check
python3 tests/test_site.py
node --check site/js/app.js
node --check site/sw.js
```

The GitHub Pages workflow repeats these checks, uploads only `site/`, and deploys only after validation succeeds.

Repository layout:

```text
ai/                         normative machine contracts
profiles/                   public research profile
research/                   source-attributed focus routing
publications/               selected paper registry
sources/                    public provenance registry
site/                       human-only Pages projection
site/data/                  generated bundle + projection receipt
tools/build_site_data.py    deterministic projection builder
tools/validate_context.py   canonical-context validator
tests/test_site.py          human-interface/boundary checks
.github/workflows/          context validation and Pages deployment
```

## Primary public sources

- https://sabinehossenfelder.com/research-2/
- https://sabinehossenfelder.com/
- https://www.mcmp.philosophie.uni-muenchen.de/people/external_members/hossenfelder_sabine/index.html
- exact arXiv revisions and DOI records listed in `publications/index.json`

## Lineage and implementation boundary

- **Synergetics 95** and **Physics X 95** contribute interaction ideas: a 1990s CD-ROM encyclopedia shell, contents explorer, search, favourites, progress marks, offline use, printing, and a visual atlas.
- **QSOL-SUBSTRATE** contributes explicit-public publication, canonical-versus-projection separation, claim-local provenance, smallest-sufficient-context, deterministic receipts, and reviewable refreshes.
- **sabine-gpt** specializes those patterns for public mathematical and foundations-of-physics research assistance.

The Pages application is an original Apache-2.0 implementation. It does not copy Microsoft Encarta code/assets or MPL-2.0 code/assets from Synergetics 95 or Physics X 95.

## License

Apache-2.0. Source papers, book titles, names, marks, and third-party webpages remain under their respective rights. This repository stores public metadata, links, and short original summaries rather than republishing papers.
