const STRINGS = {
  en: {
    profileName: "Your Name",
    profileTagline: "Professional storyteller",
    statViews: "Views",
    statImpressions: "Impressions",
    paneSource: "Plain language",
    paneSourceHint: "What you really mean",
    paneTarget: "LinkedIn",
    paneTargetHint: "Corporate voice",
    labelRaw: "Your real phrase",
    placeholderRaw:
      'e.g. I blew my savings on an NFT drop and they repossessed my car.',
    placeholderOutput: "Your LinkedIn post will appear here…",
    outputLangLabel: "Post language",
    btnTranslate: "Translate",
    copy: "Copy",
    loading: "Translating…",
    newsTitle: "LinkedIn News",
    news1: "Buzzwords up 12% week over week",
    news2: "“Thrilled to share” remains #1 opener",
    news3: "Thought leadership enters flow state",
    footerNote: "Powered by AI · Not affiliated with LinkedIn",
    copied: "Copied",
  },
  uk: {
    profileName: "Ваше ім’я",
    profileTagline: "Професійний оповідач",
    statViews: "Перегляди",
    statImpressions: "Покази",
    paneSource: "Звичайна мова",
    paneSourceHint: "Що ви маєте на увазі",
    paneTarget: "LinkedIn",
    paneTargetHint: "Корпоративний тон",
    labelRaw: "Ваша справжня фраза",
    placeholderRaw:
      "напр.: Я витратив усі заощадження на дроп і в мене забрали машину.",
    placeholderOutput: "Тут з’явиться ваш LinkedIn-допис…",
    outputLangLabel: "Мова допису",
    btnTranslate: "Перекласти",
    copy: "Копіювати",
    loading: "Перекладаємо…",
    newsTitle: "Новини LinkedIn",
    news1: "Базворди зросли на 12% за тиждень",
    news2: "«Радію поділитися» лідирує в інтро",
    news3: "Таут-лідерство входить у потік",
    footerNote: "На базі ШІ · Не пов’язано з LinkedIn",
    copied: "Скопійовано",
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
  } catch (e) {
    showError(e.message || "Request failed");
    if (resultText.textContent?.trim()) {
      resultText.hidden = false;
      resultEmpty.hidden = true;
      copyBtn.disabled = false;
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

applyI18n();
