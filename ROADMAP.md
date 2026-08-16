# sabine-gpt Roadmap

## Phase 0 — Public-only bootstrap

- [x] Establish explicit public-source-only boundary.
- [x] Add machine bootstrap and load order.
- [x] Add epistemic-state contract with `unknown`, `candidate_proof`, and `numerically_supported` states.
- [x] Add mathematical research contract.
- [x] Add persona/affiliation boundary.
- [x] Add public source registry.
- [x] Add research-focused public profile.
- [x] Add current-focus routing.
- [x] Add selected current-work paper registry.
- [x] Add offline validator and GitHub Actions CI.

## Phase 0.5 — Human research desk

- [x] Add an original Encarta-95-style GitHub Pages interface inspired by Synergetics 95 and Physics X 95 interaction patterns.
- [x] Add one-click navigation for public research themes, selected papers, source trails, and help.
- [x] Add local favourites, reviewed-paper marks, search, print, responsive layout, and offline caching.
- [x] Add a visual atlas whose edges mean explicit registry membership only.
- [x] Add a human-controlled Research Brief builder with no automatic external transmission.
- [x] Generate the site data deterministically from canonical public records.
- [x] Bind canonical input hashes, canonical fingerprint, generator identity, and artifact hash in a projection manifest.
- [x] Mark the Pages bundle `projection_only`; canonical public records remain authoritative.
- [x] Exclude `site/**` from AI context, embeddings, training, RAG ingestion, automated summarisation, and claim support.
- [x] Add crawler deterrence and an honest warning that public GitHub Pages is not authentication or secrecy.
- [x] Add static, accessibility, projection, access-boundary, and Pages workflow validation.

## Phase 1 — Mathematical humility gauntlet

Build a deterministic evaluation suite for the failure modes this repository is meant to prevent.

- [ ] Add problems where a seductive premise is false.
- [ ] Add problems with missing hypotheses.
- [ ] Add problems where a numerical pattern looks like a proof but is not one.
- [ ] Add problems with a known counterexample hidden behind plausible algebra.
- [ ] Add literature-status questions that require checking whether a result is still open.
- [ ] Add adversarial prompts that ask the model to claim certainty without evidence.
- [ ] Score whether the assistant localizes the exact unknown rather than hallucinating closure.
- [ ] Score whether the assistant requests the missing source/definition/constraint when appropriate.

Working title: **The Bullshitometer Test Suite**.

## Phase 2 — Research problem packets

- [ ] Define a machine-readable problem-packet schema.
- [ ] Store statement, notation, assumptions, known lemmas, references, attempted methods, and blockers separately.
- [ ] Add a claim ledger with epistemic state per claim.
- [ ] Add a proof-attempt ledger so failed approaches remain useful without becoming conclusions.
- [ ] Add reproducible symbolic/numerical check recipes.
- [ ] Add citation dependencies for imported theorems.

## Phase 3 — Foundations-of-physics domain packs

Create small opt-in packs rather than one giant prompt.

- [ ] Locality / Bell assumptions / statistical independence.
- [ ] Measurement problem / collapse criteria.
- [ ] Superdeterminism / future-input dependence / retrocausality taxonomy.
- [ ] Fine-tuning / overfitting / experimental discrimination.
- [ ] Quantum-gravity-linked collapse models.
- [ ] Optional historical background pack for minimal length and earlier quantum-gravity work.

## Phase 4 — Public-source refresh pipeline

- [ ] Poll public arXiv author records for new or revised papers.
- [ ] Resolve DOI and journal metadata from authoritative public records.
- [ ] Open review PRs instead of silently mutating canonical context.
- [ ] Mark stale records when a newer primary source supersedes them.
- [ ] Preserve exact arXiv version and retrieval date.
- [ ] Never ingest private sources automatically.

## Phase 5 — Verification harness

- [ ] Add CAS-assisted checks where licensing and runtime permit.
- [ ] Add numerical edge-case and counterexample probes.
- [ ] Add dimension/unit checks for physics derivations.
- [ ] Add optional Lean 4 proof artifacts for tractable formal statements.
- [ ] Distinguish machine-checked theorem, checked computation, and heuristic evidence in receipts.

## Phase 6 — Model adapters

- [ ] OpenAI/ChatGPT transport profile.
- [ ] Generic system-prompt profile.
- [ ] Ollama/open-weight profile.
- [ ] Retrieval-augmented profile for larger paper sets.
- [ ] Verify that adapters change transport only, not canonical claims or epistemic states.

## Permanent constraints

These are not roadmap items; they are invariants.

- Public information only.
- No private QSOL-CONTEXT data copied into this repository.
- No private correspondence, leaks, or inferred personal profile.
- No impersonation or claim of endorsement.
- Absence is unknown, not false.
- A failed attempt is not an impossibility proof.
- A plausible derivation is not automatically a proof.
- "I don't know yet" is a valid and often optimal result.
- `ADJACENT_TRUTH != INHERITED_TRUTH`.
- `PROJECTION != CANONICAL_SOURCE`.
- Human-interface export is deliberate and smallest-sufficient; no automatic external transmission.
