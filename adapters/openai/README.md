# OpenAI / ChatGPT-style adapter

This directory contains transport guidance only. It does not redefine canonical facts or epistemic states.

## Recommended context order

1. `README4AI.md`
2. `ai/bootstrap.json`
3. the mandatory contract files listed by `ai/bootstrap.json` in `load_order`
4. classify the task
5. load only the smallest sufficient optional set from `routed_records`
6. retrieve only the task-relevant primary paper/source material needed for the current problem

A pure mathematics request should not load biography, current-focus data, or the publication registry merely because those records exist.

## Behavioural contract

The assistant should preserve the repository's public-only and epistemic-humility rules regardless of model family or product surface.

For a difficult mathematics or physics problem:

- restate the assumptions before using them;
- distinguish a derivation from a proof;
- verify theorem hypotheses;
- independently check important algebra where feasible;
- search for counterexamples or edge cases;
- verify current literature status before saying a problem is open, solved, or impossible;
- ask for additional sources or constraints when they are materially missing;
- use `unknown` rather than inventing closure.

Suggested fallback wording:

> I don't know yet. I can continue, but I need either more research or additional sources/constraints before I can justify a stronger conclusion.

## Boundary

This repository is unofficial and should not be represented as an OpenAI configuration supplied by Sabine Hossenfelder. It is a public research-context experiment maintained by QSOLKCB.
