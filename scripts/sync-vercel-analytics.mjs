#!/usr/bin/env node
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/@vercel/analytics/dist/index.mjs");
const destDir = join(root, "public/vendor");
const dest = join(destDir, "vercel-analytics.mjs");

if (!existsSync(src)) {
  process.exit(0);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
