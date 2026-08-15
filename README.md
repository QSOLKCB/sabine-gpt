# sabine-gpt

A public-source-only research context pack for a GPT-5.6-class assistant intended to help Sabine Hossenfelder with mathematics and foundations-of-physics work.

> **Unofficial.** This repository is not authored, endorsed, or maintained by Sabine Hossenfelder or OpenAI. It is a QSOLKCB research-context experiment built entirely from publicly available sources.

The design combines the **selective, machine-first context architecture** of `QSOL-CONTEXT` with the **public-boundary, epistemic-state, and retrieval contracts** of `QSOL-SUBSTRATE`. No private QSOL-CONTEXT records are copied into this repository.

## Design target

The assistant should be useful precisely because it is willing to stop pretending.

When solving mathematics or physics problems it should:

- separate **proved**, **derived**, **inferred**, **working-hypothesis**, **unknown**, and **conflicting** claims;
- prefer primary sources and exact paper/version identifiers;
- verify the present status of a supposedly open or solved problem rather than relying on memory;
- show assumptions and identify the step at which an argument depends on them;
- search for counterexamples and alternative formulations before declaring a problem impossible;
- label an unverified proof as a **candidate proof**, not a proof;
- say **"I don't know yet"** when evidence is insufficient;
- ask for additional papers, definitions, constraints, or sources when they would materially change the answer;
- never convert confidence into evidence.

A good failure mode is:

> I don't know yet. The available context is insufficient to justify that conclusion. I need more research, or additional sources/constraints from you, before I can claim this is solved or unsolved.

## Public research context

Sabine's public research page says her work is mostly in the foundations of physics. Her MCMP profile describes current interests around **locality**, **fine-tuning**, **superdeterminism/contextuality**, and ways these ideas can be experimentally tested.

The initial paper set therefore prioritizes:

| Priority | Paper | Why it is loaded |
|---|---|---|
| 1 | **How Gravity Can Explain the Collapse of the Wavefunction** (2025), arXiv:2510.11037v1 | Recent work connecting quantum gravity, locality, measurement, and a testable collapse model. |
| 2 | **Taxonomy for Physics Beyond Quantum Mechanics** (2024), Proc. R. Soc. A 480, 20230779, arXiv:2309.12293v2 | Canonical terminology for superdeterministic, retrocausal, future-input-dependent, and related models. |
| 3 | **Quantum Confusions, Cleared Up (or so I hope)** (rev. 2024), arXiv:2309.12299v2 | Instrumental treatment of common quantum-foundations and locality claims. |
| 4 | **Bell's theorem allows local theories of quantum mechanics** (2022), Nature Physics 18, 1382, arXiv:2211.01331v2 | Central to the locality/statistical-independence distinction. |
| 5 | **What does it take to solve the measurement problem?** (2022), J. Phys. Commun. 6 102001, arXiv:2206.10445v3 | Defines what would count as solving the measurement problem. |
| 6 | **Comment on "Experimentally adjudicating..."** (2024), Phys. Rev. A 109, 026201, arXiv:2206.10619v4 | Directly relevant to fine-tuning, overfitting, and empirical discrimination. |
| 7 | **A Future-Input Dependent Path Integral for Quantum Mechanics** (2022), Annals of Physics 440, 168827, arXiv:2110.07168v1 | Mathematical machinery for future-input-dependent dynamics and collapse. |
| 8 | **A Toy Model for Local and Deterministic Wave-function Collapse** (2022), Phys. Rev. A 106, 022212, arXiv:2010.01327v5 | Concrete local deterministic model and statistical-independence violation. |

The machine-readable registry is in `publications/index.json`; source provenance is in `sources/public-sources.json`.

## Machine bootstrap

AI agents should begin with:

```text
README4AI.md
ai/bootstrap.json
```

The mandatory contract layer then loads, in order:

1. public source policy;
2. epistemic-state contract;
3. math/research contract;
4. retrieval policy;
5. persona/affiliation boundary.

After the task is classified, `ai/bootstrap.json` supplies `routed_records`. Consumers load only the smallest sufficient optional set: for example, a pure mathematics problem does **not** load Sabine's profile or publication registry, while a literature-status or quantum-foundations task can route to the source registry, current-focus data, and selected publications as needed.

## Repository layout

```text
ai/                       normative machine contracts
profiles/                 public biographical/research profile only
research/                 current research-focus routing
publications/             selected paper registry
sources/                  public provenance registry
adapters/openai/          transport guidance for OpenAI-style assistants
tools/                    local validation
.github/workflows/        CI
```

## Public-only boundary

Every canonical claim in this repository must be traceable to a public source. Private correspondence, private context repositories, leaked material, personal inference, and unsupported biographical reconstruction are forbidden as evidence.

Absence from the repository means **unknown/unloaded**, not false.

Static repository records use a cached/source-attributed epistemic state; `retrieved` is reserved for evidence actually fetched during the active task.

The screenshot in the repository is a motivational artifact. It is **not** canonical evidence for research claims or personal attributes.

## Primary public sources

- https://sabinehossenfelder.com/research-2/
- https://sabinehossenfelder.com/
- https://www.mcmp.philosophie.uni-muenchen.de/people/external_members/hossenfelder_sabine/index.html
- https://arxiv.org/
- journal DOI landing pages listed in `publications/index.json`

## Lineage

- `QSOLKCB/QSOL-CONTEXT` contributes the selective machine-context pattern.
- `QSOLKCB/QSOL-SUBSTRATE` contributes the explicit public boundary, epistemic-state discipline, and smallest-sufficient-context retrieval pattern.
- `QSOLKCB/sabine-gpt` specializes those ideas for public mathematical and physics research assistance.

## License

Apache-2.0. Source papers and third-party webpages remain under their own respective licenses and copyright terms; this repository stores metadata, links, and short original summaries rather than republishing paper text.
