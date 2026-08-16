# Human interface and automated-access boundary

`site/**` is the human-facing Sabine Research Desk 95 interface. It is intentionally separate from the repository's canonical AI context routes.

## Automated systems

Automated retrieval, crawler indexing, model training, RAG ingestion, embedding/vectorisation, automated summarisation, and dataset construction from `site/**` are denied.

Repository-aware AI agents must not load `site/**` as evidence, model context, biography, research context, or training material. The narrow exception is an explicit repository-owner request to build, repair, validate, or accessibility-test the interface. Even under that exception, the site must not be promoted into canonical evidence.

AI consumers deliberately given this repository by a human must begin at `README4AI.md` and follow `ai/bootstrap.json`. Canonical claims remain in the source-attributed structured records outside `site/**`.

## Human-mediated export

The Research Brief screen lets a human choose a question, constraints, and the smallest relevant paper set. Nothing is transmitted automatically. Copying or downloading that packet is a deliberate human action and does not grant automated systems general access to the site.

## Technical honesty

The Pages artifact includes crawler directives, per-page no-index/no-training metadata, `llms.txt`, and `ai-access-policy.json`. These are meaningful policy signals for compliant systems.

They are not authentication, encryption, a paywall, or a secrecy control. GitHub Pages is public and cannot guarantee that a non-compliant crawler will obey those signals. Any material that must be technically inaccessible requires authenticated hosting and must not be committed to this public repository.

## Claim boundary

The interface is generated from canonical public records. Each substantive card keeps its own record or source trail. A true neighbouring statement does not supply evidence for an unsupported statement: `ADJACENT_TRUTH != INHERITED_TRUTH`.

The generated bundle and `site/data/projection-manifest.json` bind canonical input paths and SHA-256s, the canonical fingerprint, generator identity, and artifact hash. The projection is portable and inspectable, but it never becomes the source of truth.
