import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

const dimensions = [
  "functionality",
  "interface",
  "data",
  "visual",
  "motion",
  "performance",
  "accessibility",
];
const measuredDimensions = new Set([
  "visual",
  "motion",
  "performance",
  "gameplay",
  "audio",
]);
const nonempty = (value) =>
  typeof value === "string" && value.trim().length > 0;
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const requiredDimensions = (kind) =>
  kind === "game" ? [...dimensions, "gameplay", "audio"] : dimensions;

async function hashFile(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export async function initialize(directory, name, kind) {
  if (!nonempty(name)) throw new Error("Supply a nonempty target name");
  if (!["app", "game"].includes(kind))
    throw new Error("Kind must be app or game");
  const destination = resolve(directory);
  await mkdir(dirname(destination), { recursive: true });
  // Exclusive creation: never overwrite an investigation, including user files.
  await mkdir(destination);
  await mkdir(resolve(destination, "evidence"));
  const manifest = {
    schema_version: 1,
    target: { name, kind, version: null, reference: null },
    scope: { inventory_complete: false, exclusions: [] },
    architecture: { decision: null, languages: [] },
    unknowns: [
      "Identify the exact reference version and map the full accessible product",
    ],
    evidence: [],
    requirements: requiredDimensions(kind).map((dimension) => ({
      id: dimension,
      dimension,
      description: `Inventory and verify ${dimension} against the reference`,
      status: "pending",
      reference_evidence: [],
      validation: null,
    })),
  };
  const documents = {
    "manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
    "AGENTS.md": `# Recreation investigation\n\nTarget: ${JSON.stringify(name)} (${kind}).\n\nRead manifest.json and handoff.md first. Follow REA's RECREATE.md and the\ncomplete workflow in workflow.md. Continue research, implementation, and\nreference comparisons until required checks pass or a concrete prerequisite\nblocks progress. Preserve observations, inferences, and unknowns separately.\nUse the existing implementation checkout; do not create worktrees unless asked.\nKeep this ledger current and never report inaccessible features as verified.\n`,
    "research.md":
      "# Research\n\nRecord target identity, source citations and capture dates, complete feature/state\ninventory, accessible boundaries, hypotheses, experiments, evidence IDs, and gaps.\n",
    "architecture.md":
      "# Architecture\n\nRecord implementation location, stack alternatives, chosen languages and reasons,\nmodule ownership, data/state contracts, assets, deployment, and build commands.\n",
    "validation.md":
      "# Validation\n\nRecord actual commands, working directories, versions, fixtures, seeds, reference\nand implementation identities, acceptance tolerances, raw output, comparisons,\nholdout scenarios, negative controls, hardware, and remaining mismatches.\n",
    "handoff.md":
      "# Handoff\n\nNo reference has been investigated yet. Resolve the target identity, acquire\navailable evidence, and map the complete accessible feature/state inventory.\nUpdate this file with implementation location, progress, actual test outcomes,\nowned processes, blockers, and the next experiment after each milestone.\n",
    "workflow.md": await readFile(
      new URL(
        "../.agents/skills/reverse-engineer-anything/references/recreation-workflow.md",
        import.meta.url,
      ),
      "utf8",
    ),
  };
  for (const [file, contents] of Object.entries(documents))
    await writeFile(resolve(destination, file), contents, { flag: "wx" });
  return destination;
}

/** Validate submitted records and their local artifacts; never execute recorded commands. */
export async function check(directory) {
  const root = await realpath(directory);
  const manifest = JSON.parse(
    await readFile(resolve(root, "manifest.json"), "utf8"),
  );
  const problems = [];
  if (!object(manifest)) return ["Manifest must be an object"];
  if (manifest.schema_version !== 1)
    problems.push("Unsupported schema_version");
  const target = manifest.target;
  if (
    !object(target) ||
    !nonempty(target.name) ||
    !["app", "game"].includes(target.kind) ||
    !nonempty(target.version) ||
    !nonempty(target.reference)
  )
    problems.push(
      "Target needs a name, app/game kind, exact version, and reference",
    );
  if (
    !object(manifest.scope) ||
    manifest.scope.inventory_complete !== true ||
    !Array.isArray(manifest.scope.exclusions) ||
    !manifest.scope.exclusions.every(nonempty)
  )
    problems.push(
      "Scope needs a complete inventory and explicit exclusions list",
    );
  if (
    !object(manifest.architecture) ||
    !nonempty(manifest.architecture.decision) ||
    !Array.isArray(manifest.architecture.languages) ||
    manifest.architecture.languages.length === 0 ||
    !manifest.architecture.languages.every(nonempty)
  )
    problems.push("Record the architecture decision and chosen languages");
  if (!Array.isArray(manifest.unknowns) || manifest.unknowns.length !== 0)
    problems.push(
      "Required unknowns remain unresolved (or unknowns is not an array)",
    );

  const evidence = new Map();
  if (!Array.isArray(manifest.evidence))
    problems.push("Evidence must be an array");
  for (const item of Array.isArray(manifest.evidence)
    ? manifest.evidence
    : []) {
    if (!object(item) || !nonempty(item.id) || evidence.has(item.id)) {
      problems.push("Evidence IDs must be nonempty and unique");
      continue;
    }
    evidence.set(item.id, item);
    if (
      !["reference", "implementation", "test"].includes(item.kind) ||
      !nonempty(item.description)
    )
      problems.push(`Evidence ${item.id}: supply a kind and description`);
    if (
      !nonempty(item.path) ||
      isAbsolute(item.path) ||
      !/^[a-f0-9]{64}$/u.test(item.sha256 ?? "")
    ) {
      problems.push(`Evidence ${item.id}: supply a relative path and SHA-256`);
      continue;
    }
    try {
      const path = await realpath(resolve(root, item.path));
      const local = relative(root, path);
      if (isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`))
        throw new Error(
          "Artifact must remain inside the investigation directory",
        );
      const digest = await hashFile(path);
      if (digest !== item.sha256)
        problems.push(`Evidence ${item.id}: artifact digest differs`);
    } catch (error) {
      problems.push(`Evidence ${item.id}: ${error.message}`);
    }
  }
  const references = (ids, kind, context) => {
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => evidence.get(id)?.kind !== kind)
    )
      problems.push(`${context}: needs registered ${kind} evidence`);
  };
  const requirements = Array.isArray(manifest.requirements)
    ? manifest.requirements
    : [];
  const ids = new Set();
  const covered = new Set();
  let verifiedFunction = false;
  for (const requirement of requirements) {
    if (
      !object(requirement) ||
      !nonempty(requirement.id) ||
      ids.has(requirement.id)
    ) {
      problems.push("Requirement IDs must be nonempty and unique");
      continue;
    }
    ids.add(requirement.id);
    const context = `Requirement ${requirement.id}`;
    covered.add(requirement.dimension);
    if (
      !requiredDimensions(target?.kind).includes(requirement.dimension) ||
      !nonempty(requirement.description)
    )
      problems.push(`${context}: supply a supported dimension and description`);
    references(requirement.reference_evidence, "reference", context);
    if (requirement.status === "not_applicable") {
      if (!nonempty(requirement.reason))
        problems.push(`${context}: explain why it is inapplicable`);
      continue;
    }
    if (requirement.status !== "verified") {
      problems.push(`${context}: not verified`);
      continue;
    }
    const validation = requirement.validation;
    if (!object(validation)) {
      problems.push(`${context}: missing validation`);
      continue;
    }
    if (!nonempty(validation.command) || validation.exit_code !== 0)
      problems.push(
        `${context}: record an actual passing command and exit_code 0`,
      );
    references(validation.implementation_evidence, "implementation", context);
    references(validation.test_evidence, "test", context);
    if (requirement.dimension === "functionality") verifiedFunction = true;
    if (measuredDimensions.has(requirement.dimension)) {
      if (!Array.isArray(validation.metrics) || validation.metrics.length === 0)
        problems.push(`${context}: requires measured comparison metrics`);
      for (const metric of Array.isArray(validation.metrics)
        ? validation.metrics
        : []) {
        if (
          !object(metric) ||
          !nonempty(metric.name) ||
          !nonempty(metric.unit) ||
          ![metric.reference, metric.actual, metric.tolerance].every(
            Number.isFinite,
          ) ||
          metric.tolerance < 0
        ) {
          problems.push(`${context}: invalid comparison metric`);
        } else if (
          Math.abs(metric.actual - metric.reference) > metric.tolerance
        )
          problems.push(`${context}: ${metric.name} exceeds tolerance`);
      }
    }
  }
  for (const dimension of requiredDimensions(target?.kind))
    if (!covered.has(dimension))
      problems.push(`Missing coverage dimension: ${dimension}`);
  if (!verifiedFunction)
    problems.push("At least one functional requirement must be verified");
  return problems;
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      kind: { type: "string", default: "app" },
      out: { type: "string" },
    },
    allowPositionals: true,
  });
  const [command, subject] = positionals;
  if (command === "prompt" && positionals.length === 1 && !values.out) {
    const introduction = await readFile(
      new URL("../RECREATE.md", import.meta.url),
      "utf8",
    );
    const workflow = await readFile(
      new URL(
        "../.agents/skills/reverse-engineer-anything/references/recreation-workflow.md",
        import.meta.url,
      ),
      "utf8",
    );
    process.stdout.write(
      `# AI recreation starter\n\nUse the full instructions below when the user says "recreate X".\nResolve the target from the user's request, then carry research through\nimplementation and evidence-backed validation with the tools available.\nThis document includes the complete workflow; linked REA references require\nrepository access. Report unavailable tools and target access honestly.\n\n${introduction}\n---\n\n${workflow}`,
    );
    return;
  }
  if (
    positionals.length !== 2 ||
    !["init", "check"].includes(command) ||
    (command === "init" && !values.out) ||
    (command === "check" && values.out)
  )
    throw new Error(
      'Usage: node scripts/recreate.mjs init "X" --kind app|game --out DIRECTORY\n       node scripts/recreate.mjs check DIRECTORY\n       node scripts/recreate.mjs prompt',
    );
  if (command === "init") {
    process.stdout.write(
      `Created investigation: ${await initialize(values.out, subject, values.kind)}\n`,
    );
  } else {
    const problems = await check(subject);
    process.stdout.write(
      `${JSON.stringify({ status: problems.length === 0 ? "evidence-records-valid" : "incomplete", problems }, null, 2)}\n`,
    );
    if (problems.length > 0) process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
