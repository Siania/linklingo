import dotenv from "dotenv";
import fs from "fs";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from project root (next to server.js), not from process.cwd()
dotenv.config({ path: path.join(__dirname, ".env") });

/** Only true when started with `node server.js` — false when Vercel imports this module as a serverless handler. */
const isMainRun =
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === path.resolve(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE = "https://api.openai.com/v1";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const XAI_API_KEY = process.env.XAI_API_KEY?.trim();
const XAI_MODEL = process.env.XAI_MODEL || "grok-4-1-fast-non-reasoning";
const XAI_BASE = "https://api.x.ai/v1";

const ADMIN_SECRET = process.env.ADMIN_SECRET?.trim();
const DATA_DIR = path.join(__dirname, "data");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.jsonl");

function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) {
    return xff.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "";
}

function appendRequestLog(req, plainText, linkedInText, lang, kind = "post") {
  if (process.env.ENABLE_REQUEST_LOG !== "true") return;
  ensureDataDir();
  const line =
    JSON.stringify({
      t: Date.now(),
      lang,
      kind,
      text: plainText.slice(0, 12000),
      result: (linkedInText || "").slice(0, 20000),
      ip: clientIp(req),
    }) + "\n";
  try {
    fs.appendFileSync(REQUESTS_FILE, line, "utf8");
  } catch (e) {
    console.error("request log append failed:", e);
  }
}

function checkAdmin(req) {
  if (!ADMIN_SECRET) return false;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim() === ADMIN_SECRET;
  }
  const q = req.query.key;
  if (typeof q === "string" && q === ADMIN_SECRET) return true;
  return false;
}

function sendTranslateResult(res, req, text, lang, result) {
  appendRequestLog(req, text, result, lang, "post");
  return res.json({ result });
}

app.use(express.json({ limit: "1mb" }));

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

/** PDF text extraction fallback (browser uses PDF.js first; serverless often cannot load pdf-parse). */
app.post("/api/extract-pdf", uploadPdf.single("file"), async (req, res) => {
  if (!req.file?.buffer?.length) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  const name = (req.file.originalname || "").toLowerCase();
  const isPdf =
    req.file.mimetype === "application/pdf" || name.endsWith(".pdf");
  if (!isPdf) {
    return res.status(400).json({ error: "Expected a PDF file." });
  }

  let parser;
  try {
    const { PDFParse } = await import("pdf-parse");
    parser = new PDFParse({ data: req.file.buffer });
    const { text } = await parser.getText();
    await parser.destroy();
    parser = undefined;
    const trimmed = (text || "").trim();
    if (!trimmed) {
      return res.status(422).json({ error: "PDF_NO_TEXT" });
    }
    return res.json({ text: trimmed });
  } catch (e) {
    console.error("extract-pdf:", e);
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        /* ignore */
      }
    }
    return res.status(500).json({
      error: "PARSE_FAILED",
      message: e?.message || "Could not read PDF.",
    });
  }
});

/**
 * Shared LLM call — same provider order as translate (OpenAI → Gemini → xAI).
 */
async function completeChat({ system, user, maxTokens = 1200, temperature = 0.85 }) {
  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !XAI_API_KEY) {
    const err = new Error("NO_AI_KEYS");
    err.code = "NO_AI_KEYS";
    throw err;
  }

  if (OPENAI_API_KEY) {
    const r = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `OpenAI API error (${r.status})`;
      throw new Error(msg);
    }
    const out = data?.choices?.[0]?.message?.content?.trim();
    if (!out) throw new Error("Empty response from model.");
    return out;
  }

  if (GEMINI_API_KEY) {
    const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Gemini API error (${r.status})`;
      throw new Error(msg);
    }
    const out = geminiExtractText(data);
    if (!out) {
      const block = data?.promptFeedback?.blockReason;
      throw new Error(
        block ? `Response blocked (${block}).` : "Empty response from Gemini.",
      );
    }
    return out;
  }

  const r = await fetch(`${XAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `xAI API error (${r.status})`;
    throw new Error(msg);
  }
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("Empty response from model.");
  return out;
}

function aboutSystemPrompt(lang) {
  const framework = `You are an expert LinkedIn profile strategist, executive recruiter, SEO copywriter, and career branding consultant.

Your task is to generate a high-impact LinkedIn About section that maximizes:
• search visibility in LinkedIn algorithm
• keyword relevance for recruiter searches
• perceived authority and credibility
• profile dwell time and readability
• conversion into interview requests or professional opportunities

Base the writing on structural and linguistic patterns observed in top-performing LinkedIn profiles within the same professional field as the user.

Apply principles from:
• LinkedIn SEO optimization research
• personal branding frameworks
• recruiter scanning behavior studies
• high-performing professional profile benchmarks
• conversion-focused copywriting
• authority positioning strategies
• keyword density optimization (without keyword stuffing)

INPUT DATA (source of truth)
The user message contains their CV/resume as plain text. You must infer and internally use these elements ONLY from that text—do not invent employers, degrees, certifications, dates, or quantified results not stated or clearly implied:
• Target job title / professional identity
• Industry
• Core skills
• Years of experience
• Key achievements (quantified when the CV provides numbers)
• Tools / technologies / methods used
• Key specialization areas
• Professional values or mission (optional—only if supported)
• Type of opportunities desired (only if supported)
• Geographic market (if relevant for SEO and only if supported)
• Unique differentiators

If the CV is sparse, stay conservative: emphasize what is known; avoid filler claims.

WRITING REQUIREMENTS
• Use keyword patterns commonly searched by recruiters in this field.
• Include industry terminology and semantic keyword variations.
• Maintain keyword density that improves search visibility without sounding robotic.
• Prioritize clarity, specificity, and credibility over generic claims.
• Avoid clichés such as: "hard-working", "team player", "passionate professional", "results-driven".
• Use measurable impact where the CV supports it.
• Ensure the tone aligns with high-performing profiles in this field.
• Optimize structure for readability and skimming.
• Maintain a professional but engaging narrative voice.
• Avoid exaggerated or unverifiable claims.

STRUCTURE
Produce the About section using this structure:
1. Authority Positioning Opening (2–3 lines): clear professional identity using primary keywords.
2. Core Expertise Summary: concise overview of specialization areas and value proposition.
3. Evidence of Competence: measurable achievements (when stated), types of projects, scale of work, industries served—only as supported by the CV.
4. Technical and Professional Capabilities: naturally integrate keyword-rich skills, tools, and methods.
5. Differentiation Statement: what makes this professional distinctive (grounded in the CV).
6. Collaboration / Opportunity Signal: openness to roles, collaborations, or projects (only if appropriate and supported or reasonably inferred).
7. Keyword Reinforcement Line: final line subtly reinforcing primary professional identity keywords.

FORMATTING RULES
• Length: 150–260 words (strict).
• Short paragraphs (1–3 lines each).
• No emojis.
• No hashtags.
• No bullet points (prose only).
• Avoid first-person repetition in every sentence (vary sentence openings).
• Natural keyword integration.
• Avoid overly complex sentences.

OUTPUT QUALITY CHECK (internal—before you finalize)
• Keywords align with plausible recruiter search queries for this field.
• Terminology matches industry standards.
• Text sounds credible to senior professionals.
• No generic filler language.
• Profile positioning is clear within the first 2 lines.

OUTPUT
Provide only the finished LinkedIn About section. No preamble, no title "About", no markdown fences, no notes.`;

  if (lang === "uk") {
    return `${framework}\n\nLANGUAGE: Write the entire About section in Ukrainian. Follow the same rules (including no emojis, hashtags, or bullet points). Use professional Ukrainian suitable for LinkedIn.`;
  }
  if (lang === "de") {
    return `${framework}\n\nLANGUAGE: Write the entire About section in German. Follow the same rules (including no emojis, hashtags, or bullet points). Use professional German suitable for LinkedIn.`;
  }
  return `${framework}\n\nLANGUAGE: Write the entire About section in English.`;
}

function aboutUserMessage(lang, cvText) {
  const head =
    lang === "de"
      ? `Nachfolgend der Lebenslauf/CV-Text. Nutze ihn als einzige Faktengrundlage. Leite daraus die INPUT-Daten-Felder ab und schreibe dann den LinkedIn-„Über mich“-Abschnitt gemäß den Systemanweisungen.`
      : lang === "uk"
        ? `Нижче текст резюме/CV. Використовуй його як єдине джерело фактів. Виведи з нього поля INPUT DATA і згенеруй розділ «Про себе» згідно з системними інструкціями.`
        : `Below is the CV/resume text. Use it as your only factual source. Infer the INPUT DATA fields from it, then write the LinkedIn About section per the system instructions.`;

  return `${head}\n\n---\n${cvText}\n---`;
}

function systemPrompt(lang) {
  const framework = `You are writing SATIRICAL LinkedIn-style posts: the fun is turning normal, human, awkward, or emotional phrases into the absurdly polished "LinkedInfluencer" voice—thought leadership, hustle culture, and fake profundity applied to mundane things.

CORE JOB
• Take whatever the user gives you (one line, a rant, a joke topic, a real story, or a plain phrase like relationship drama) and REPACKAGE it as an over-earnest LinkedIn feed post.
• The reader should still recognize the original topic—the humor is the corporate framing, not inventing a totally unrelated story.
• Lean into parody: "thrilled to share", "lessons learned", "doubling down", "strategic pivot", "growth mindset", "optimizing my emotional portfolio", "excited to announce", "after much reflection", "here to add value", fake metrics, fake frameworks, "humbled by", etc.—but twist them around the user's actual subject.
• It should feel FUN and satirical, not like dry SEO or boring corporate PR. Wit beats blandness.

TONE
• Playful, exaggerated, self-aware mock-seriousness—like the internet parody of LinkedIn, not a real recruiter's template.
• If the input is short or emotional, stretch it into absurd "professional" language while keeping the gist.
• Do not punch down at real marginalized groups; keep the satire aimed at corporate speak and the topic itself.

STYLE REQUIREMENTS
• Strong hook in the first 1–2 lines (curiosity or fake announcement energy).
• Short paragraphs (1–2 sentences each), mobile-friendly.
• Optional: one fake-sounding "lesson" or "takeaway" in fluent LinkedIn clichés.
• End with a question or engagement bait that fits the joke (still satirical).
• Length: about 120–220 words (stay in range).
• Hashtags: exactly 3–5; mix serious-sounding and silly ones that fit the topic (e.g. #EmotionalIntelligence #GrowthMindset #Leadership if the post is about loving your ex—parody, not spam).

FORMATTING
• No emojis unless the user's input clearly invites them.
• One blank line, then the hashtag line on its own line(s).
• No markdown fences, no title line like "Post:".

OUTPUT
Return only the finished post body, then a blank line, then the hashtag line. Nothing else.`;

  if (lang === "uk") {
    return `${framework}\n\nLANGUAGE: Увесь пост українською. Сатиричний «лінкедінівський» тон і жарти з корпоративного мовлення; хештеги можна латиницею як у LinkedIn.`;
  }
  if (lang === "de") {
    return `${framework}\n\nLANGUAGE: Der gesamte Post auf Deutsch. Satirischer LinkedIn-/Hustle-Kultur-Ton; Hashtags passend zum Witz.`;
  }
  return `${framework}\n\nLANGUAGE: Write the entire post in English.`;
}

function geminiExtractText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts?.length) return "";
  return parts.map((p) => p.text ?? "").join("").trim();
}

app.post("/api/translate", async (req, res) => {
  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !XAI_API_KEY) {
    return res.status(503).json({
      error:
        "Server is missing OPENAI_API_KEY, GEMINI_API_KEY, or XAI_API_KEY. Add one to .env and restart.",
    });
  }

  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  const rawLang = req.body?.lang;
  const lang =
    rawLang === "uk" ? "uk" : rawLang === "de" ? "de" : "en";

  if (!text || text.length > 8000) {
    return res.status(400).json({ error: "Provide non-empty text under 8000 characters." });
  }

  const system = systemPrompt(lang);
  const userMsg =
    lang === "de"
      ? `Verpacke den folgenden Text in einen satirischen LinkedIn-Post (siehe Systemanweisungen). Thema und Kerninhalt erkennbar lassen; der Witz ist die übertriebene Corporate-Sprache.\n\n${text}`
      : lang === "uk"
        ? `Перетвори наступний текст на сатиричний LinkedIn-пост (див. системні інструкції). Тема має лишатися зрозумілою; жарт — у «лінкедінівському» пафосі.\n\n${text}`
        : `Turn the following into a satirical LinkedIn-style post per the system instructions. Keep the topic recognizable; the joke is the over-the-top professional voice, not changing the subject into something else.\n\n${text}`;

  try {
    const out = await completeChat({
      system,
      user: userMsg,
      maxTokens: 1400,
      temperature: 0.82,
    });
    return sendTranslateResult(res, req, text, lang, out);
  } catch (e) {
    if (e.code === "NO_AI_KEYS") {
      return res.status(503).json({
        error:
          "Server is missing OPENAI_API_KEY, GEMINI_API_KEY, or XAI_API_KEY. Add one to .env and restart.",
      });
    }
    console.error(e);
    const msg = e?.message || "Translation request failed.";
    if (msg.includes("API error") || msg.includes("blocked") || msg.includes("Empty")) {
      return res.status(502).json({ error: msg });
    }
    res.status(500).json({ error: "Translation request failed." });
  }
});

app.post("/api/about", async (req, res) => {
  if (!OPENAI_API_KEY && !GEMINI_API_KEY && !XAI_API_KEY) {
    return res.status(503).json({
      error:
        "Server is missing OPENAI_API_KEY, GEMINI_API_KEY, or XAI_API_KEY. Add one to .env and restart.",
    });
  }

  const cvText =
    typeof req.body?.cvText === "string" ? req.body.cvText.trim() : "";
  const rawLang = req.body?.lang;
  const lang =
    rawLang === "uk" ? "uk" : rawLang === "de" ? "de" : "en";

  if (!cvText || cvText.length > 50000) {
    return res.status(400).json({
      error: "Provide non-empty CV text under 50,000 characters.",
    });
  }

  const system = aboutSystemPrompt(lang);
  const user = aboutUserMessage(lang, cvText);

  try {
    const about = await completeChat({
      system,
      user,
      maxTokens: 1600,
      temperature: 0.68,
    });
    appendRequestLog(req, `[About] ${cvText.slice(0, 8000)}`, about, lang, "about");
    return res.json({ about });
  } catch (e) {
    if (e.code === "NO_AI_KEYS") {
      return res.status(503).json({
        error:
          "Server is missing OPENAI_API_KEY, GEMINI_API_KEY, or XAI_API_KEY.",
      });
    }
    console.error(e);
    const msg = e?.message || "About generation failed.";
    if (msg.includes("API error") || msg.includes("blocked") || msg.includes("Empty")) {
      return res.status(502).json({ error: msg });
    }
    res.status(500).json({ error: "About generation failed." });
  }
});

app.get("/api/admin/requests", (req, res) => {
  if (!ADMIN_SECRET) {
    return res.status(503).json({
      error: "ADMIN_SECRET is not set. Add it to .env and restart the server.",
    });
  }
  if (!checkAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  ensureDataDir();
  if (!fs.existsSync(REQUESTS_FILE)) {
    return res.json({ entries: [] });
  }
  let raw = "";
  try {
    raw = fs.readFileSync(REQUESTS_FILE, "utf8");
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not read request log." });
  }
  const entries = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      /* skip bad line */
    }
  }
  entries.sort((a, b) => (b.t || 0) - (a.t || 0));
  res.json({ entries });
});

app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".mjs")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      }
    },
  }),
);

/* Local / Node: listen. Vercel imports this file — argv[1] is not server.js, so we only export `app`. */
if (isMainRun) {
  const server = app.listen(PORT, () => {
    console.log(`Linklingo at http://localhost:${PORT}`);
    if (ADMIN_SECRET) {
      if (process.env.ENABLE_REQUEST_LOG === "true") {
        console.log(`Admin request log: GET /admin.html (paste ADMIN_SECRET)`);
      } else {
        console.log(
          `Request logging off (ENABLE_REQUEST_LOG is not "true"); admin log stays empty unless enabled.`,
        );
      }
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other process or set PORT to a free port (e.g. PORT=3001).`,
      );
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

export default app;
