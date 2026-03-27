import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE = "https://api.openai.com/v1";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL || "grok-4-1-fast-non-reasoning";
const XAI_BASE = "https://api.x.ai/v1";

app.use(express.json({ limit: "32kb" }));

function systemPrompt(lang) {
  const base = `You rewrite casual, blunt, or negative real-life statements into the exaggerated "LinkedIn voice": upbeat, corporate, full of phrases like "thrilled to share", "excited to announce", "personal and professional journey", "double down", "embrace grit", soft euphemisms for bad news, and fake wisdom. Sound authentic to the platform but clearly satirical. Keep the same underlying facts but spin them positively. Output ONLY the rewritten post text, no quotes around it, no preamble like "Here is". Use short paragraphs or line breaks where a LinkedIn post would.`;

  if (lang === "uk") {
    return `${base} Write entirely in Ukrainian (українська мова), matching Ukrainian LinkedIn / business social style.`;
  }
  return `${base} Write entirely in English.`;
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
  const lang = req.body?.lang === "uk" ? "uk" : "en";

  if (!text || text.length > 8000) {
    return res.status(400).json({ error: "Provide non-empty text under 8000 characters." });
  }

  const system = systemPrompt(lang);
  const userMsg = `Rewrite this into LinkedIn-speak:\n\n${text}`;

  try {
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
            { role: "user", content: userMsg },
          ],
          temperature: 0.85,
          max_tokens: 1200,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          `OpenAI API error (${r.status})`;
        return res.status(502).json({ error: msg });
      }
      const out = data?.choices?.[0]?.message?.content?.trim();
      if (!out) {
        return res.status(502).json({ error: "Empty response from model." });
      }
      return res.json({ result: out });
    }

    if (GEMINI_API_KEY) {
      const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: userMsg }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 1200,
          },
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          `Gemini API error (${r.status})`;
        return res.status(502).json({ error: msg });
      }
      const out = geminiExtractText(data);
      if (!out) {
        const block = data?.promptFeedback?.blockReason;
        return res.status(502).json({
          error: block
            ? `Response blocked (${block}).`
            : "Empty response from Gemini.",
        });
      }
      return res.json({ result: out });
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
          { role: "user", content: userMsg },
        ],
        temperature: 0.85,
        max_tokens: 1200,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `xAI API error (${r.status})`;
      return res.status(502).json({ error: msg });
    }
    const out = data?.choices?.[0]?.message?.content?.trim();
    if (!out) {
      return res.status(502).json({ error: "Empty response from model." });
    }
    return res.json({ result: out });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Translation request failed." });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Linklingo at http://localhost:${PORT}`);
});
