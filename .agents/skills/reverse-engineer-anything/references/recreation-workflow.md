# Whole-product recreation workflow

Use this workflow when the user says `recreate X`, `clone this app`, or asks for
a detailed app/game reconstruction. Own research, implementation, verification,
and handoff; a superficial visual demo does not fulfill a whole-product request.
Use the existing REA tool-routing and evidence guides for artifact analysis.
When using REA Evidence bundles, retain the existing
`build_reconstruction_obligation_ledger` and `evaluate_reconstruction_coverage`
tools for authenticated claim closure. Discover their actual schemas before
calling them. The checkout workbench is a human/agent project ledger; its hash
checks do not replace REA's Evidence authentication or authority comparisons.

## Identify and resume

Read repository instructions, `RECREATE.md`, and any existing investigation's
`manifest.json` and `handoff.md`. Keep the existing checkout; cloud tasks are
already isolated and need no new worktree unless requested. Preserve user work.
If no investigation exists, initialize it with `scripts/recreate.mjs` as described
in `RECREATE.md`. Keep evidence outside application source directories.

Resolve the product, edition, version/build, platform, and primary user flows.
Use supplied URLs, source, packages, installed apps, and recordings. Research
official documentation, manuals, changelogs, public demos, and accessible runtime
behavior when available. Record source URL/path, version, capture date, digest
for local artifacts, and the claims each source supports. Distinguish observed,
source-derived, inferred, and unknown facts. Public screenshots cannot establish
backend behavior; names and marketing pages cannot establish implementation.

Infer ordinary defaults and continue useful work. Ask for only missing access,
ambiguous target identity, or constraints that block a material next step. Do
not invent account access, tooling, assets, evidence, or hidden source. Never
claim to have inspected an inaccessible screen or completed an unrun test.

## Research the complete accessible surface

Create an inventory before committing to the architecture. Cover navigation,
screens, dialogs, controls, empty/loading/error/offline states, roles, permissions,
settings, keyboard/controller/touch input, accessibility, responsive layouts,
localization, persistence, import/export, integrations, and background work.
Follow important flows end to end, including state transitions and failures.
Map each item to requirements, evidence, and planned verification. Add newly
discovered items; record inspected and inaccessible boundaries separately.

For source targets, trace entry points, modules, dependencies, data models,
protocols, tests, and build configuration with ordinary repository tools. For
shipped targets, use the appropriate existing REA analysis and runtime workflows.
Do not invoke every provider indiscriminately. Inspect resources alongside code;
use supported target selection, execution, cancellation, and cleanup boundaries.
Do not add bypass or protection-defeat capabilities to this fork.

Maintain a question ledger: hypothesis, evidence, counterexample, confidence,
next discriminating experiment, and result. Investigate contradictions. Reuse
valid prior evidence, but recapture changed versions. Research duration follows
unresolved questions and measured mismatches; neither a fixed number of searches
nor prolonged idle work establishes depth. Exhaust pagination and selected
coverage where completeness matters; record truncation and sampling limits.

## Specify before building

Write behavior contracts, data schemas, state transitions, visual tokens, asset
inventories, animation timing, and acceptance criteria. Measure reference behavior
before defining comparison thresholds. Choose representative and adversarial
scenarios, plus holdout cases not used to tune implementation. Agree measurable
fidelity tolerances from the reference and target environment; do not relax them
just to obtain a green report. Log changes to scope and criteria with reasons.

In `architecture.md`, compare viable stacks, including the original stack when
known. Select languages/frameworks/engines for deployment, fidelity, performance,
ecosystem support, and maintainability. Multiple languages are appropriate at
measured boundaries; additional runtimes need a concrete benefit, stable typed
contracts, serialization/error semantics, versioning, and integration tests.
Do not assume polyglot code is intrinsically faster. Profile the actual workload.

Use cohesive modules with explicit state and resource ownership, inward-facing
domain contracts, validated boundaries, deterministic tests, secure defaults,
structured diagnostics, and documented migrations. Keep solutions proportional;
avoid speculative abstractions and unmeasured optimizations. Do not copy the
reference's accidental defects without documenting compatibility requirements.

## Implement and compare repeatedly

Build an executable vertical slice early, then implement the inventory in
dependency order. Each slice includes real behavior, failure handling, tests,
and comparison to reference observations. Do not leave decorative controls or
mock services presented as complete functionality. Clearly label deliberate
fixtures and simulated integrations. Keep builds reproducible and record tool
versions, dependency locks, and commands in the correct working directory.

Replay recorded inputs against the reference and implementation with identical
initial state. Normalize volatile timestamps/IDs only when justified; preserve
the raw captures. Verify outputs, state transitions, stored data, round trips,
network contracts where accessible, error paths, and restart recovery. Use
unit tests for semantics, integration tests for boundaries, and end-to-end tests
for complete user journeys. Verify tests executed; a zero-test exit is no proof.

For visual comparisons, match viewport, scale, fonts, renderer, platform,
camera, input state, and animation time. Save reference/candidate/diff images;
measure layout and perceptual/pixel differences and inspect meaningful mismatches.
For motion, compare time-aligned frame sequences, trajectories, easing, transition
durations, and event timing. A static screenshot does not validate animation.
Measure latency, frame pacing, throughput, memory, and startup under comparable
conditions. Use repeated runs, warm/cold distinctions, and report variance.

Use historical input replays and held-out scenarios as backtesting. Keep fixtures
independent of the implementation and check that a deliberate mismatch fails the
comparator before trusting it. Do not edit expected outputs to hide regressions.
After a fix, rerun affected comparisons and downstream flows. Retain raw results
and command exit statuses. A passing local subset is not whole-product parity.

## Additional game investigation

Inventory levels, mechanics, modes, controls, camera, physics/timestep, collision,
AI behavior, progression, economy, inventory, save/load, networking, accessibility,
and deterministic seed/replay support. Record which modes and content were seen.
Measure mechanics through repeatable experiments rather than guessing from video.

Inventory meshes/topology, texture sets/resolution, UVs, materials, shader models,
lights/shadows, color pipeline, postprocessing, particles, LODs, UI, and audio.
Document asset provenance and missing assets. Separate engine behavior from art
content. Build a representative scene to validate the selected renderer before
committing to extensive implementation. Match camera, projection, exposure,
lighting, material response, and animation clocks for visual comparisons.

Measure animation skeletons, clips, blend trees, root motion, IK, event timing,
transitions, and input-to-response latency. Replay seeded inputs where possible;
otherwise report nondeterminism and use distributions/tolerances. Compare audio
timing and levels, physics trajectories, collisions, game rules, AI decisions,
and long-run save/replay stability. Verify on target hardware; Linux headless
tests cannot establish console/mobile fidelity or a proprietary engine's parity.

## Persist and finish honestly

Keep full evidence on disk and concise summaries in context. Update the manifest,
research ledger, and handoff after meaningful milestones. The handoff must state
current target identity, working directories, implementation commit/changes,
completed and outstanding requirements, decisions, exact tested commands/results,
owned services and cleanup, blockers, and the next actionable experiment.
This allows another model/session to resume without rereading the entire app.

Run `scripts/recreate.mjs check` against the investigation. Resolve missing or
stale evidence and all required comparisons. The checker validates submitted
records and hashes; it cannot independently establish exhaustive coverage or
the truth of captures. Inspect the actual artifacts and test reports too.

Deliver runnable source, build/run/test instructions, captured evidence, measured
differences, and a coverage report. Distinguish verified, partial, inaccessible,
inapplicable, and unrun work. If a required prerequisite is unavailable, complete
independent work and state the exact blocked requirement and next action.
Never describe the result as identical or complete while required gaps remain.
