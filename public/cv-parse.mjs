/**
 * CV text extraction — PDFs are read in the browser first (PDF.js), then /api/extract-pdf as fallback.
 * PDF.js is vendored under /vendor/pdfjs (see scripts/copy-pdfjs.mjs) so CSP and workers work reliably.
 */

const MAX_BYTES = 12 * 1024 * 1024;

function err(code, cause) {
  const e = new Error(code);
  e.code = code;
  if (cause) e.cause = cause;
  return e;
}

function pdfJsAssetUrls() {
  const pdfMain = new URL("/vendor/pdfjs/pdf.mjs", import.meta.url).href;
  const pdfWorker = new URL("/vendor/pdfjs/pdf.worker.mjs", import.meta.url).href;
  return { pdfMain, pdfWorker };
}

async function extractPdfInBrowser(file) {
  const { pdfMain, pdfWorker } = pdfJsAssetUrls();
  const pdfjsLib = await import(pdfMain);
  const getDocument =
    typeof pdfjsLib.getDocument === "function"
      ? pdfjsLib.getDocument
      : pdfjsLib.default?.getDocument;
  if (typeof getDocument !== "function") {
    throw new Error("pdfjs getDocument unavailable");
  }
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;

  let full = "";
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const textContent = await page.getTextContent();
    const parts = [];
    for (const item of textContent.items) {
      if (item && typeof item.str === "string" && item.str) {
        parts.push(item.str);
      }
    }
    full += parts.join(" ") + "\n";
  }
  return full.trim();
}

async function extractPdfViaServer(file) {
  let res;
  try {
    const fd = new FormData();
    fd.append("file", file, file.name);
    res = await fetch("/api/extract-pdf", { method: "POST", body: fd });
  } catch {
    throw err("PARSE_FAILED");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error === "PDF_NO_TEXT") throw err("PDF_NO_TEXT");
    throw err("PARSE_FAILED");
  }
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) throw err("PDF_NO_TEXT");
  return { text, format: ".pdf" };
}

async function extractPdf(file) {
  try {
    const text = await extractPdfInBrowser(file);
    if (text.length > 0) {
      return { text, format: ".pdf" };
    }
  } catch (e) {
    console.warn("PDF.js (browser) failed, trying server:", e);
  }
  return extractPdfViaServer(file);
}

async function extractDocx(file) {
  const mammothMod = await import("https://esm.sh/mammoth@1.8.0");
  const mammoth = mammothMod.default ?? mammothMod;
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  const text = (result.value || "").trim();
  if (!text) throw err("DOCX_NO_TEXT");
  return { text, format: ".docx" };
}

function looksLikePdf(file) {
  return file.type === "application/pdf";
}

/**
 * @param {File} file
 * @returns {Promise<{ text: string, format: string }>}
 */
export async function extractCvText(file) {
  if (!file?.name) throw err("NO_FILE");
  if (file.size > MAX_BYTES) throw err("FILE_TOO_LARGE");

  const lower = file.name.toLowerCase();
  let ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";

  if (ext !== ".pdf" && looksLikePdf(file)) {
    ext = ".pdf";
  }

  if ([".txt", ".md", ".markdown"].includes(ext)) {
    const text = (await file.text()).trim();
    if (!text) throw err("EMPTY_FILE");
    return { text, format: ext };
  }

  if (ext === ".doc") throw err("DOC_LEGACY");

  if (ext === ".pdf") {
    try {
      return await extractPdf(file);
    } catch (e) {
      if (e.code) throw e;
      throw err("PARSE_FAILED", e);
    }
  }

  if (ext === ".docx") {
    try {
      return await extractDocx(file);
    } catch (e) {
      if (e.code) throw e;
      throw err("PARSE_FAILED", e);
    }
  }

  throw err("UNSUPPORTED");
}
