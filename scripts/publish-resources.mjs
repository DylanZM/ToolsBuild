#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const DATA_FILE = "src/data/links.json";
const BRANCH = "resources";
const BASE = "master";

function run(cmd, args, { allowFail = false, quiet = false } = {}) {
  const result = spawnSync(cmd, args, {
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
  });
  if (result.status !== 0 && !allowFail) process.exit(result.status ?? 1);
  return result;
}

function output(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "";
}

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

const message = process.argv.slice(2).join(" ").trim() || "feat: add new resources";

if (output("git", ["rev-parse", "--is-inside-work-tree"]) !== "true") {
  fail("No estás dentro de un repositorio git.");
}

const lines = output("git", ["status", "--porcelain"]).split("\n").filter(Boolean);
const unrelated = lines.filter((line) => !line.endsWith(DATA_FILE));
if (unrelated.length > 0) {
  fail(`Hay cambios sin commitear fuera de ${DATA_FILE}:\n${unrelated.join("\n")}\nHaz commit o descártalos antes de publicar.`);
}
const hasDataChanges = lines.some((line) => line.endsWith(DATA_FILE));

run("git", ["fetch", "origin", BASE], { quiet: true });
output("git", ["fetch", "origin", BRANCH]);

if (output("git", ["rev-parse", "--abbrev-ref", "HEAD"]) !== BRANCH) {
  run("git", ["checkout", BRANCH]);
}

const ahead = Number(output("git", ["rev-list", "--count", `origin/${BRANCH}..${BRANCH}`]) || 0);
if (ahead > 0) {
  fail(`La rama ${BRANCH} tiene ${ahead} commit(s) locales sin publicar.\nEjecuta 'git push origin ${BRANCH}' o resetea la rama antes de continuar.`);
}

if (hasDataChanges) run("git", ["stash", "push", "--", DATA_FILE], { quiet: true });
run("git", ["reset", "--hard", `origin/${BASE}`], { quiet: true });
if (hasDataChanges) {
  const pop = run("git", ["stash", "pop"], { allowFail: true });
  if (pop.status !== 0) {
    fail(`Conflicto al reaplicar los cambios de ${DATA_FILE}. Resuélvelo manualmente y vuelve a ejecutar.`);
  }
}

if (!output("git", ["status", "--porcelain"])) {
  console.log(`Sin cambios en ${DATA_FILE}. ${BRANCH} está al día con ${BASE}.`);
  process.exit(0);
}

run("git", ["add", DATA_FILE]);
run("git", ["commit", "-m", message]);
run("git", ["push", "-u", "origin", BRANCH]);

const prNumber = output("gh", [
  "pr", "list", "--head", BRANCH, "--base", BASE,
  "--state", "open", "--json", "number", "--jq", ".[0].number",
]);

if (prNumber) {
  const url = output("gh", ["pr", "view", prNumber, "--json", "url", "--jq", ".url"]);
  console.log(`\nPR #${prNumber} actualizado: ${url}`);
} else if (output("gh", ["--version"])) {
  run("gh", [
    "pr", "create", "--base", BASE, "--head", BRANCH,
    "--title", message, "--body", "Automated resources update.",
  ]);
} else {
  console.log(`\nAbre el PR manualmente: https://github.com/DylanZM/ToolsBuild/compare/${BASE}...${BRANCH}?expand=1`);
}
