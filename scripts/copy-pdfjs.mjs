#!/usr/bin/env node
/**
 * Copy PDF.js browser build into public/vendor so cv-parse.mjs loads same-origin
 * (avoids esm.sh / third-party CDN failures: CSP, workers, offline).
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "node_modules/pdfjs-dist/build");
const destDir = join(root, "public/vendor/pdfjs");

const pairs = [
  ["pdf.min.mjs", "pdf.mjs"],
  ["pdf.worker.min.mjs", "pdf.worker.mjs"],
];

if (!existsSync(join(srcDir, "pdf.min.mjs"))) {
  console.warn("copy-pdfjs: pdfjs-dist not installed, skip");
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
for (const [from, to] of pairs) {
  copyFileSync(join(srcDir, from), join(destDir, to));
}
console.log("copy-pdfjs: public/vendor/pdfjs/pdf.mjs + pdf.worker.mjs");
