#!/usr/bin/env node
/**
 * Stage all changes, commit with a message, and push.
 * Usage: npm run git:sync -- "your message"
 * If no message, uses: chore: sync <iso date>
 */
import { execSync } from "node:child_process";

const msg =
  process.argv.slice(2).join(" ").trim() ||
  `chore: sync ${new Date().toISOString().slice(0, 19)}Z`;

try {
  execSync("git rev-parse --git-dir", { stdio: "pipe" });
} catch {
  console.error("Not a git repository.");
  process.exit(1);
}

execSync("git add -A", { stdio: "inherit" });

try {
  execSync("git diff --cached --quiet", { stdio: "pipe" });
  console.log("Nothing to commit.");
  process.exit(0);
} catch {
  /* staged changes exist */
}

execSync(`git commit -m ${JSON.stringify(msg)}`, { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
