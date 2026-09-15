#!/usr/bin/env node
/**
 * Fail if git would commit secrets.
 * Usage: node scripts/check-no-secrets.mjs [--staged]
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const stagedOnly = process.argv.includes("--staged");

const BLOCKED_NAME =
  /(^|\/|\\)(\.env|\.env\..*|\.pem|\.p12|\.key|\.crt|\.pfx)$/i;
const ALLOWED_ENV_EXAMPLES = new Set([
  ".env.example",
  ".env.production.example",
]);

const CONTENT_PATTERNS = [
  { name: "private-key-block", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "generic-live-secret", re: /\bsk_live_[A-Za-z0-9]{16,}\b/ },
];

function listFiles() {
  if (stagedOnly) {
    const out = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf8",
      cwd: root,
    });
    return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  const out = execSync("git ls-files -z", { encoding: "utf8", cwd: root });
  return out.split("\0").filter(Boolean);
}

function walkUntrackedSecrets(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const ent of entries) {
    if (ent.name === "node_modules" || ent.name === ".git" || ent.name === ".next") continue;
    const full = join(dir, ent.name);
    const rel = relative(root, full).replace(/\\/g, "/");
    if (ent.isDirectory()) {
      walkUntrackedSecrets(full, acc);
      continue;
    }
    if (ALLOWED_ENV_EXAMPLES.has(ent.name)) continue;
    if (BLOCKED_NAME.test(ent.name) || BLOCKED_NAME.test(rel)) {
      try {
        execSync(`git check-ignore -q -- "${rel}"`, { cwd: root });
      } catch {
        acc.push(rel);
      }
    }
  }
  return acc;
}

const errors = [];
for (const file of listFiles()) {
  const base = file.split(/[/\\]/).pop() ?? file;
  if (ALLOWED_ENV_EXAMPLES.has(base)) continue;
  if (BLOCKED_NAME.test(file) || BLOCKED_NAME.test(base)) {
    errors.push(`Arquivo sensível versionado/staged: ${file}`);
    continue;
  }
  if (!existsSync(join(root, file)) || statSync(join(root, file)).isDirectory()) continue;
  if (!/\.(ts|tsx|js|mjs|cjs|json|md|yml|yaml|toml|env|txt)$/i.test(file)) continue;
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  if (file.endsWith("package-lock.json") || text.length > 1_500_000) continue;
  for (const pat of CONTENT_PATTERNS) {
    if (pat.re.test(text)) errors.push(`Padrão suspeito (${pat.name}) em ${file}`);
  }
}
for (const f of walkUntrackedSecrets(root)) {
  errors.push(`Arquivo sensível NÃO ignorado pelo git: ${f}`);
}

if (errors.length) {
  console.error("check-no-secrets: FALHOU\n");
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log(stagedOnly ? "check-no-secrets: staged OK" : "check-no-secrets: tracked OK");
