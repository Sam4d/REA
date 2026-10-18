import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, test } from "vitest";

const script = fileURLToPath(
  new URL("../../../scripts/recreate.mjs", import.meta.url),
);
const roots: string[] = [];
const run = (...args: string[]) =>
  spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

async function initialize(kind = "app") {
  const root = await mkdtemp(join(tmpdir(), "rea-recreation-"));
  roots.push(root);
  const directory = join(root, "investigation");
  const result = run(
    "init",
    "Example product",
    "--kind",
    kind,
    "--out",
    directory,
  );
  expect(result.status, result.stderr).toBe(0);
  return directory;
}

async function completedFixture(kind = "app") {
  const directory = await initialize(kind);
  const manifest = JSON.parse(
    await readFile(join(directory, "manifest.json"), "utf8"),
  );
  manifest.target.version = "test-fixture-1";
  manifest.target.reference =
    "Synthetic comparator fixture, not a real product validation";
  manifest.scope.inventory_complete = true;
  manifest.architecture = {
    decision: "Fixture exercising workbench validation",
    languages: ["JavaScript"],
  };
  manifest.unknowns = [];
  for (const evidenceKind of ["reference", "implementation", "test"]) {
    const contents = `Synthetic ${evidenceKind} fixture\n`;
    const path = `evidence/${evidenceKind}.txt`;
    await writeFile(join(directory, path), contents);
    manifest.evidence.push({
      id: evidenceKind,
      kind: evidenceKind,
      path,
      sha256: createHash("sha256").update(contents).digest("hex"),
      description: `Synthetic ${evidenceKind} evidence`,
    });
  }
  for (const requirement of manifest.requirements) {
    requirement.status = "verified";
    requirement.reference_evidence = ["reference"];
    requirement.validation = {
      command: "synthetic passing fixture",
      exit_code: 0,
      implementation_evidence: ["implementation"],
      test_evidence: ["test"],
      metrics: [
        {
          name: "fixture difference",
          unit: "fixture units",
          reference: 0,
          actual: 0.01,
          tolerance: 0.01,
        },
      ],
    };
  }
  const save = () =>
    writeFile(join(directory, "manifest.json"), JSON.stringify(manifest));
  await save();
  return { directory, manifest, save };
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe("recreation workbench public commands", () => {
  test("exports the complete portable starter without writing configuration", () => {
    const result = run("prompt");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("# AI recreation starter");
    expect(result.stdout).toContain("# Whole-product recreation workflow");
    expect(result.stdout).toContain("## Additional game investigation");
    expect(result.stdout).toContain("holdout");
    expect(run("prompt", "unexpected").status).toBe(1);
  });
  test("creates a resumable workflow and refuses to overwrite existing work", async () => {
    const directory = await initialize();
    expect(await readFile(join(directory, "workflow.md"), "utf8")).toContain(
      "holdout",
    );
    expect(await readFile(join(directory, "AGENTS.md"), "utf8")).toContain(
      "handoff.md",
    );
    await writeFile(join(directory, "handoff.md"), "User work");
    expect(run("init", "Other", "--out", directory).status).toBe(1);
    expect(await readFile(join(directory, "handoff.md"), "utf8")).toBe(
      "User work",
    );
    const result = run("check", directory);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("not verified");
    expect(result.stdout).toContain("unknowns remain unresolved");
  });

  test.each(["app", "game"])(
    "accepts complete synthetic %s evidence records at the tolerance boundary",
    async (kind) => {
      const { directory } = await completedFixture(kind);
      const result = run("check", directory);
      expect(result.status, result.stderr + result.stdout).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        status: "evidence-records-valid",
        problems: [],
      });
    },
  );

  test("rejects altered artifacts even when all requirements say verified", async () => {
    const { directory } = await completedFixture();
    await writeFile(
      join(directory, "evidence/reference.txt"),
      "Changed reference",
    );
    const result = run("check", directory);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("artifact digest differs");
  });

  test("rejects evidence paths and symlinks outside the investigation", async () => {
    const { directory, manifest, save } = await completedFixture();
    const outside = join(directory, "..", "outside.txt");
    await writeFile(outside, "outside");
    await symlink(outside, join(directory, "evidence/escape.txt"));
    manifest.evidence[0].path = "evidence/escape.txt";
    await save();
    const result = run("check", directory);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("must remain inside");
    manifest.evidence[0].path = "../outside.txt";
    await save();
    expect(run("check", directory).status).toBe(1);
  });

  test("rejects failed commands, wrong evidence kinds, and out-of-tolerance metrics", async () => {
    const { directory, manifest, save } = await completedFixture();
    manifest.requirements[0].validation.exit_code = 1;
    manifest.requirements[0].validation.test_evidence = ["reference"];
    manifest.requirements.find(
      (item: { dimension: string }) => item.dimension === "visual",
    ).validation.metrics[0].actual = 0.5;
    await save();
    const result = run("check", directory);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("passing command");
    expect(result.stdout).toContain("registered test evidence");
    expect(result.stdout).toContain("exceeds tolerance");
  });

  test("rejects deleted dimensions, duplicate IDs, and unresolved scope", async () => {
    const { directory, manifest, save } = await completedFixture("game");
    manifest.requirements = manifest.requirements.filter(
      (item: { dimension: string }) => item.dimension !== "gameplay",
    );
    manifest.requirements.push(manifest.requirements[0]);
    manifest.evidence.push(manifest.evidence[0]);
    manifest.scope.inventory_complete = false;
    await save();
    const result = run("check", directory);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Missing coverage dimension: gameplay");
    expect(result.stdout).toContain("IDs must be nonempty and unique");
    expect(result.stdout).toContain("complete inventory");
  });

  test("requires explained reference-backed exemptions and rejects an all-exempt ledger", async () => {
    const { directory, manifest, save } = await completedFixture();
    for (const requirement of manifest.requirements) {
      requirement.status = "not_applicable";
      requirement.reason = "Fixture exemption";
    }
    manifest.requirements[0].reason = "";
    manifest.requirements[0].reference_evidence = [];
    await save();
    const result = run("check", directory);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("At least one functional requirement");
    expect(result.stdout).toContain("explain why it is inapplicable");
    expect(result.stdout).toContain("registered reference evidence");
  });

  test("fails closed for malformed input and invalid CLI usage", async () => {
    const directory = await initialize();
    await writeFile(join(directory, "manifest.json"), "null");
    expect(run("check", directory).status).toBe(1);
    await writeFile(join(directory, "manifest.json"), "{");
    expect(run("check", directory).status).toBe(1);
    expect(run("check").status).toBe(1);
    expect(
      run(
        "init",
        "Example",
        "--kind",
        "other",
        "--out",
        join(directory, "invalid"),
      ).status,
    ).toBe(1);
    expect(run("check", directory, "--unknown").status).toBe(1);
  });
});
