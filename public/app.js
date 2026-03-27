import { inject } from "/vendor/vercel-analytics.mjs";
inject();

const STRINGS = {
  en: {
    labelProfileName: "Display name",
    labelProfileTagline: "Headline",
    placeholderProfileName: "Jamie Hustle",
    placeholderProfileTagline: "CEO & Founder of My Life | Main Character Energy",
    paneSource: "Plain language",
    paneSourceHint: "What you really mean",
    paneTarget: "LinkedIn",
    paneTargetHint: "LinkedIn post",
    labelRaw: "Your real phrase",
    placeholderRaw:
      "e.g. I got arrested for fraud, or they towed my car after the NFT drop.",
    placeholderOutput: "Your LinkedIn post will appear here…",
    btnTranslate: "Translate",
    copy: "Copy",
    loading: "Translating…",
    postNow: "now",
    newsTitle: "LinkedIn News",
    news1: "Buzzwords up 12% week over week",
    news2: "“Thrilled to share” remains #1 opener",
    news3: "Thought leadership enters flow state",
    footerCredit:
      'Made with "love" to corporate world by Oksana Kozhan',
    copied: "Copied",
    previewNameFallback: "Your Name",
    previewTaglineFallback: "Professional storyteller",
  },
  uk: {
    labelProfileName: "Ім’я в профілі",
    labelProfileTagline: "Підпис",
    placeholderProfileName: "Джеймі Хасл",
    placeholderProfileTagline:
      "CEO та засновник мого життя | Головний персонаж | #Зростання",
    paneSource: "Звичайна мова",
    paneSourceHint: "Що ви маєте на увазі",
    paneTarget: "LinkedIn",
    paneTargetHint: "Пост у LinkedIn",
    labelRaw: "Ваша справжня фраза",
    placeholderRaw:
      "напр.: мене взяли за шахрайство, або забрали машину після дропу.",
    placeholderOutput: "Тут з’явиться ваш LinkedIn-допис…",
    btnTranslate: "Перекласти",
    copy: "Копіювати",
    loading: "Перекладаємо…",
    postNow: "щойно",
    newsTitle: "Новини LinkedIn",
    news1: "Базворди зросли на 12% за тиждень",
    news2: "«Радію поділитися» лідирує в інтро",
    news3: "Таут-лідерство входить у потік",
    footerCredit:
      'Зроблено з «любов’ю» до корпоративного світу — Оксана Кожан',
    copied: "Скопійовано",
    previewNameFallback: "Ваше ім’я",
    previewTaglineFallback: "Професійний оповідач",
  },
};

let uiLang = "en";

const rawInput = document.getElementById("rawInput");
const RAW_MIN_H = 56;

function rawInputMaxHeight() {
  const compact = translatorCard?.classList.contains("translator--has-result");
  if (compact) {
    return Math.min(window.innerHeight * 0.22, 140);
  }
  return Math.min(window.innerHeight * 0.38, 200);
}

function fitRawInput() {
  const ta = rawInput;
  if (!ta || !ta.classList.contains("pane-input--fit")) return;
  const maxH = rawInputMaxHeight();
  ta.style.height = "auto";
  const target = Math.min(maxH, Math.max(RAW_MIN_H, ta.scrollHeight));
  ta.style.height = `${target}px`;
  ta.style.overflowY = ta.scrollHeight > maxH ? "auto" : "hidden";
}

function applyI18n() {
  const t = STRINGS[uiLang];
  document.documentElement.lang = uiLang === "uk" ? "uk" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] != null) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] != null) el.placeholder = t[key];
  });

  const raw = document.getElementById("rawInput");
  if (raw && t.placeholderRaw) raw.placeholder = t.placeholderRaw;
  requestAnimationFrame(() => fitRawInput());
}

document.querySelectorAll("[data-lang-ui]").forEach((btn) => {
  btn.addEventListener("click", () => {
    uiLang = btn.getAttribute("data-lang-ui") === "uk" ? "uk" : "en";
    document.querySelectorAll("[data-lang-ui]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    applyI18n();
    syncPreviewLabels();
  });
});

const translatorCard = document.getElementById("translatorCard");

const translateBtn = document.getElementById("translateBtn");
const errorMsg = document.getElementById("errorMsg");
const resultText = document.getElementById("resultText");
const resultEmpty = document.getElementById("resultEmpty");
const targetLoading = document.getElementById("targetLoading");
const copyBtn = document.getElementById("copyBtn");
const profileNameInput = document.getElementById("profileNameInput");
const profileTaglineInput = document.getElementById("profileTaglineInput");
const resultPreviewHead = document.getElementById("resultPreviewHead");
const resultPreviewName = document.getElementById("resultPreviewName");
const resultPreviewSub = document.getElementById("resultPreviewSub");

function previewDisplayName() {
  const t = STRINGS[uiLang];
  const v = profileNameInput?.value?.trim();
  if (v) return v;
  const ph = profileNameInput?.placeholder?.trim();
  return ph || t.previewNameFallback;
}

function previewDisplayTagline() {
  const t = STRINGS[uiLang];
  const v = profileTaglineInput?.value?.trim();
  if (v) return v;
  const ph = profileTaglineInput?.placeholder?.trim();
  return ph || t.previewTaglineFallback;
}

function syncPreviewLabels() {
  if (!resultPreviewName || !resultPreviewSub) return;
  resultPreviewName.textContent = previewDisplayName();
  resultPreviewSub.textContent = previewDisplayTagline();
}

/** Fresh visit: no persisted fields, no leftover translation UI. */
function resetSessionUi() {
  try {
    localStorage.removeItem("linklingo_profile_name");
    localStorage.removeItem("linklingo_profile_tagline");
  } catch {
    /* ignore */
  }
  if (rawInput) rawInput.value = "";
  if (profileNameInput) profileNameInput.value = "";
  if (profileTaglineInput) profileTaglineInput.value = "";
  if (resultText) {
    resultText.textContent = "";
    resultText.hidden = true;
  }
  if (resultEmpty) resultEmpty.hidden = false;
  if (targetLoading) targetLoading.hidden = true;
  if (resultPreviewHead) resultPreviewHead.hidden = true;
  if (copyBtn) copyBtn.disabled = true;
  showError("");
  setResultSplitLayout(false);
  requestAnimationFrame(() => fitRawInput());
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = !msg;
}

function setResultSplitLayout(on) {
  translatorCard?.classList.toggle("translator--has-result", !!on);
  requestAnimationFrame(() => fitRawInput());
}

async function translate() {
  const text = rawInput.value.trim();
  if (!text) {
    showError(uiLang === "uk" ? "Введіть текст." : "Enter some text.");
    return;
  }

  showError("");
  setResultSplitLayout(true);
  translateBtn.disabled = true;
  copyBtn.disabled = true;
  resultText.hidden = true;
  resultEmpty.hidden = true;
  targetLoading.hidden = false;
  if (resultPreviewHead) resultPreviewHead.hidden = true;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang: uiLang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    resultText.textContent = data.result || "";
    resultText.hidden = false;
    resultEmpty.hidden = true;
    copyBtn.disabled = false;
    syncPreviewLabels();
    if (resultPreviewHead) resultPreviewHead.hidden = false;
  } catch (e) {
    showError(e.message || "Request failed");
    if (resultText.textContent?.trim()) {
      resultText.hidden = false;
      resultEmpty.hidden = true;
      copyBtn.disabled = false;
      syncPreviewLabels();
      if (resultPreviewHead) resultPreviewHead.hidden = false;
    } else {
      resultEmpty.hidden = false;
      resultText.hidden = true;
      setResultSplitLayout(false);
    }
  } finally {
    targetLoading.hidden = true;
    translateBtn.disabled = false;
  }
}

translateBtn.addEventListener("click", translate);

rawInput.addEventListener("input", () => fitRawInput());
rawInput.addEventListener("paste", () => requestAnimationFrame(() => fitRawInput()));
window.addEventListener("resize", () => fitRawInput());

rawInput.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    translate();
  }
});

copyBtn.addEventListener("click", async () => {
  const t = STRINGS[uiLang];
  const label = copyBtn.querySelector('[data-i18n="copy"]');
  try {
    await navigator.clipboard.writeText(resultText.textContent || "");
    const prev = label ? label.textContent : "";
    if (label) label.textContent = t.copied;
    setTimeout(() => {
      if (label) label.textContent = prev;
    }, 2000);
  } catch {
    /* ignore */
  }
});

resetSessionUi();
applyI18n();
syncPreviewLabels();
requestAnimationFrame(() => fitRawInput());
