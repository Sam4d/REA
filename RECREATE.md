# Recreate an app or game with REA

This is a customized fork of [morluto/rea](https://github.com/morluto/rea),
imported at `fd728f271e7de7bcfa63890b573715720d5f948c`. Upstream source,
history, license, CLI, MCP server, and provider boundaries are retained.

## Install your fork

```bash
git clone --recurse-submodules https://github.com/Sam4d/REA.git
cd REA
```

Install the Node.js version in `.nvmrc` and the npm version in
`package.json#packageManager` (currently Node.js 24.18.0 and npm 11.16.0).
Then run:

```bash
npm ci
npm run build:cached
node scripts/rea.mjs --help
```

Open this folder in your coding AI. To connect the built fork to Codex as an
MCP server, first inspect its configuration plan:

```bash
node scripts/rea.mjs setup --client codex --dry-run --json
```

After reviewing the paths, backups, and proposed changes, apply that scope with
`node scripts/rea.mjs setup --client codex --yes`, then restart the client.
Use the appropriate client ID for other supported agents. Use this checkout's
CLI to install the customized skill; `npx rea-agents setup` installs the upstream
release and does not include this fork's additions. MCP registration is optional
when your agent can invoke the CLI directly.

## Start with an AI

Open this repository in a coding agent that reads `AGENTS.md`, then say:

```text
Recreate X. Follow RECREATE.md and the recreation workflow. Investigate the
whole accessible product, build the implementation, and validate it against
the reference. Keep the evidence and handoff current until the work is done.
```

Replace X with the app/game name and include a URL, repository, executable,
package, or reference recordings when available. A name starts identification;
it does not give the agent access to a private service or a game installation.
The agent must resolve ambiguities and missing access before claiming fidelity.

For an AI that cannot read this checkout, attach this file and
[the complete workflow](.agents/skills/reverse-engineer-anything/references/recreation-workflow.md),
then provide repository/tool access. A chat-only model can research and plan;
implementation and testing require a coding environment. Instructions do not
change model weights, context limits, or tool permissions.

To export both documents as one self-contained AI starter:

```bash
node scripts/recreate.mjs prompt > ../REA_AI_START.md
```

Attach the resulting Markdown file to the AI and say `recreate X`. The full
workflow is included; access to source, artifacts, and tools is still needed.

## Track a recreation

Run from this repository using a supported Node.js version:

```bash
node scripts/recreate.mjs init "X" --kind app --out ../x-investigation
# Use --kind game for gameplay and audio coverage too.
node scripts/recreate.mjs check ../x-investigation
```

Initialization creates a portable `AGENTS.md`, a `manifest.json` coverage ledger,
and research, architecture, validation, and handoff documents. It refuses to
overwrite an existing directory. Keep the investigation separate from the
implementation checkout; `AGENTS.md` in the investigation instructs the next
agent how to resume. Copy its instructions to the implementation's existing
agent guidance by merging, rather than overwriting user instructions.

The check exits nonzero until the inventory and architecture are recorded,
unknowns are resolved, and all requirements have evidence. Each verified
requirement needs reference, implementation, and passing-test artifacts whose
SHA-256 digests match their files. Visual, motion, performance, gameplay, and
audio requirements also need numerical comparisons against explicit tolerances.
An inapplicable dimension needs a reference-backed explanation. At least one
functional requirement must pass; an all-exempt ledger never passes.

This checks the submitted evidence ledger, not the truth of an agent's claims.
It does not run arbitrary recorded commands or establish that an inventory is
exhaustive. Review captures, measurements, and test results; use the workflow's
holdout scenarios to avoid tuning only to the examples used during development.

Manifest evidence entries have this form (paths are relative to the investigation):

```json
{
  "id": "reference-menu",
  "kind": "reference",
  "path": "evidence/reference-menu.png",
  "sha256": "<SHA-256 of the actual file>",
  "description": "Menu captured from reference version/build at fixed viewport"
}
```

A requirement keeps its `id`, `dimension`, and `description`, and becomes:

```json
{
  "id": "menu-layout",
  "dimension": "visual",
  "description": "Menu layout at the recorded viewport",
  "status": "verified",
  "reference_evidence": ["reference-menu"],
  "validation": {
    "command": "<actual comparison command run in the implementation checkout>",
    "exit_code": 0,
    "implementation_evidence": ["implementation-menu"],
    "test_evidence": ["menu-comparison-output"],
    "metrics": [
      {
        "name": "pixel mismatch fraction",
        "unit": "fraction",
        "reference": 0,
        "actual": 0.002,
        "tolerance": 0.005
      }
    ]
  }
}
```

Register the implementation screenshot with kind `implementation` and the
comparison result with kind `test`. Record the viewport, seed, hardware,
renderer, time, tool version, and reproduction procedure in `validation.md`.
Tolerances are acceptance decisions made before optimization; they are not
evidence of pixel identity. Use multiple metrics and requirements where needed.

## What the workflow asks the agent to do

1. Identify the exact version and map every accessible feature, screen, state,
   subsystem, resource, and integration. Preserve coverage gaps explicitly.
2. Investigate code/artifacts and runtime behavior with the relevant tools.
   Keep source citations, reference captures, experiments, and counterexamples.
3. Choose languages and engines from platform, fidelity, interoperability,
   performance, and maintenance needs. Justify each additional runtime.
4. Implement tested vertical slices, expanding to the complete inventory.
5. Replay reference scenarios and unseen holdout scenarios; compare behavior,
   screenshots, animation trajectories, persistence, sound, and performance.
6. Fix mismatches, rerun affected checks, and leave reproducible build/run/test
   commands with a precise report of verified, partial, and blocked work.

For games this includes camera, lighting, materials, shaders, animation blending,
physics, input latency, AI, audio, save/load, and frame pacing. Source recovery
does not recover missing assets or hidden servers. Use supplied assets where
permitted, or record replacement work and its visual differences. Preserve
upstream's provider and execution boundaries.

## Development and loading REA

Use `.nvmrc` and `package.json#packageManager`, then `npm ci` and
`npm run build:cached`. `node scripts/rea.mjs --help` exposes the CLI;
`node scripts/rea.mjs mcp` starts the stdio MCP server for a configured client.
The build includes the recreation workflow in the existing packaged skill.
See upstream [setup instructions](README.md#quick-start) for client registration
and bring-your-own analysis engines. Loading a document alone does not register
MCP tools in a running AI session.

The workbench is a checkout development tool; it does not add a new REA MCP
operation or replace the upstream CLI. No specific target app or game has been
recreated merely by installing this workflow.
