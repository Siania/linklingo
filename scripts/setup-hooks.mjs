#!/usr/bin/env node
/**
 * Points this repo at .githooks so post-commit (auto-push) runs after npm install.
 */
import { execSync } from "node:child_process";

try {
  execSync("git rev-parse --git-dir", { stdio: "pipe" });
} catch {
  process.exit(0);
}

try {
  execSync("git config core.hooksPath .githooks", { stdio: "inherit" });
  console.log("Git: core.hooksPath → .githooks (post-commit will push to origin)");
} catch {
  process.exit(0);
}
