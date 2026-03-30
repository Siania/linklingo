/** Client-side CV text extraction — PDFs go to /api/extract-pdf; other formats stay in-browser. */

const MAX_BYTES = 12 * 1024 * 1024;

function err(code, cause) {
  const e = new Error(code);
  e.code = code;
  if (cause) e.cause = cause;
  return e;
}

async function extractPdf(file) {
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
