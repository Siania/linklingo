const LS_NAME = "linklingo_profile_name";
const LS_TAGLINE = "linklingo_profile_tagline";

const STRINGS = {
  en: {
    statViews: "Views",
    statImpressions: "Impressions",
    labelProfileName: "Display name",
    labelProfileTagline: "Headline",
    placeholderProfileName: "Jamie Hustle",
    placeholderProfileTagline: "CEO & Founder of My Life | Main Character Energy",
    paneSource: "Plain language",
    paneSourceHint: "What you really mean",
    paneTarget: "LinkedIn",
    paneTargetHint: "Corporate voice",
    labelRaw: "Your real phrase",
    placeholderRaw:
      "e.g. I got arrested for fraud, or they towed my car after the NFT drop.",
    placeholderOutput: "Your LinkedIn post will appear here…",
    outputLangLabel: "Post language",
    btnTranslate: "Translate",
    copy: "Copy",
    loading: "Translating…",
    postNow: "now",
    newsTitle: "LinkedIn News",
    news1: "Buzzwords up 12% week over week",
    news2: "“Thrilled to share” remains #1 opener",
    news3: "Thought leadership enters flow state",
    footerNote: "Powered by AI · Not affiliated with LinkedIn",
    footerDisclaimer:
      "This isn’t an original idea, and I don’t claim ownership of it. @",
    copied: "Copied",
    previewNameFallback: "Your Name",
    previewTaglineFallback: "Professional storyteller",
  },
  uk: {
    statViews: "Перегляди",
    statImpressions: "Покази",
    labelProfileName: "Ім’я в профілі",
    labelProfileTagline: "Підпис",
    placeholderProfileName: "Джеймі Хасл",
    placeholderProfileTagline:
      "CEO та засновник мого життя | Головний персонаж | #Зростання",
    paneSource: "Звичайна мова",
    paneSourceHint: "Що ви маєте на увазі",
    paneTarget: "LinkedIn",
    paneTargetHint: "Корпоративний тон",
    labelRaw: "Ваша справжня фраза",
    placeholderRaw:
      "напр.: мене взяли за шахрайство, або забрали машину після дропу.",
    placeholderOutput: "Тут з’явиться ваш LinkedIn-допис…",
    outputLangLabel: "Мова допису",
    btnTranslate: "Перекласти",
    copy: "Копіювати",
    loading: "Перекладаємо…",
    postNow: "щойно",
    newsTitle: "Новини LinkedIn",
    news1: "Базворди зросли на 12% за тиждень",
    news2: "«Радію поділитися» лідирує в інтро",
    news3: "Таут-лідерство входить у потік",
    footerNote: "На базі ШІ · Не пов’язано з LinkedIn",
    footerDisclaimer:
      "Це не оригінальна ідея; я не претендую на авторство. @",
    copied: "Скопійовано",
    previewNameFallback: "Ваше ім’я",
    previewTaglineFallback: "Професійний оповідач",
  },
};

let uiLang = "en";
let outLang = "en";

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

document.querySelectorAll("[data-lang-out]").forEach((btn) => {
  btn.addEventListener("click", () => {
    outLang = btn.getAttribute("data-lang-out") === "uk" ? "uk" : "en";
    document.querySelectorAll("[data-lang-out]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
  });
});

const rawInput = document.getElementById("rawInput");
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

function persistProfile() {
  try {
    localStorage.setItem(LS_NAME, profileNameInput?.value ?? "");
    localStorage.setItem(LS_TAGLINE, profileTaglineInput?.value ?? "");
  } catch {
    /* ignore */
  }
}

function loadProfile() {
  try {
    const n = localStorage.getItem(LS_NAME);
    const t = localStorage.getItem(LS_TAGLINE);
    if (n != null) profileNameInput.value = n;
    if (t != null) profileTaglineInput.value = t;
  } catch {
    /* ignore */
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = !msg;
}

async function translate() {
  const text = rawInput.value.trim();
  if (!text) {
    showError(uiLang === "uk" ? "Введіть текст." : "Enter some text.");
    return;
  }

  showError("");
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
      body: JSON.stringify({ text, lang: outLang }),
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
    }
  } finally {
    targetLoading.hidden = true;
    translateBtn.disabled = false;
  }
}

translateBtn.addEventListener("click", translate);

rawInput.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    translate();
  }
});

profileNameInput?.addEventListener("input", persistProfile);
profileTaglineInput?.addEventListener("input", persistProfile);

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

loadProfile();
applyI18n();
syncPreviewLabels();
