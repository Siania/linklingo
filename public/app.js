import { inject } from "/vendor/vercel-analytics.mjs";
import { extractCvText } from "/cv-parse.mjs";

inject();

const STRINGS = {
  en: {
    labelProfileName: "Display name",
    labelProfileTagline: "Headline",
    placeholderProfileName: "Jamie Hustle",
    placeholderProfileTagline: "CEO & Founder of My Life | Main Character Energy",
    paneSource: "Topic & notes",
    paneSourceHint: "Rough idea or bullet points",
    paneTarget: "LinkedIn",
    paneTargetHint: "LinkedIn post",
    labelRaw: "Your input",
    placeholderRaw:
      "e.g. Lesson from a project: how we cut handover time by 30% — context, what we tried, one takeaway.",
    placeholderOutput: "Your LinkedIn post will appear here…",
    btnTranslate: "Generate post",
    copy: "Copy",
    loading: "Generating…",
    postNow: "now",
    newsTitle: "LinkedIn News",
    news1: "Buzzwords up 12% week over week",
    news2: "“Thrilled to share” remains #1 opener",
    news3: "Thought leadership enters flow state",
    footerNote: "Powered by AI · Not affiliated with LinkedIn",
    footerDisclaimer:
      "@This isn’t an original idea, and I don’t claim ownership of it.",
    footerCredit:
      'Made with "love" to corporate world by Oksana Kozhan',
    copied: "Copied",
    backlogOpen: "History",
    backlogHeading: "Your backlog",
    backlogHint: "Stored only in this browser on this device — not on our servers. Only you see it here.",
    backlogEmpty: "Nothing saved yet.",
    backlogClear: "Clear all",
    backlogClearConfirm: "Remove all saved prompts from this device?",
    backlogLoad: "Load",
    backlogDeleteOne: "Remove from history",
    backlogCloseAria: "Close",
    previewNameFallback: "Your Name",
    previewTaglineFallback: "Professional storyteller",
    langBadgeNew: "New",
    modePost: "Post",
    modeAbout: "About",
    modeAriaLabel: "Tool",
    aboutCvLabel: "Your CV",
    aboutCvHint: "Paste text or drop a file — PDF, Word, or text",
    labelCv: "CV text",
    placeholderCv: "Or paste your CV here and edit before generating.",
    dropzoneTitle: "Drop your CV here",
    dropzoneBrowse: "or tap to browse",
    dropzoneFormats: "PDF · Word (.docx) · Plain text · Markdown",
    dropzonePrivacy:
      "PDFs are parsed on the server in memory (not saved). Word & text stay in your browser until you generate.",
    clearFileAria: "Remove file",
    parsingFile: "Reading file…",
    errFileTooLarge: "File is too large (max 12 MB).",
    errUnsupportedFormat: "Use PDF, Word (.docx), plain text, or Markdown.",
    errDocLegacy: "Old .doc format isn’t supported — save as .docx or PDF and try again.",
    errPdfNoText: "Couldn’t read text from this PDF (it may be scanned). Try text or Word.",
    errDocxNoText: "Couldn’t read text from this Word file. Try saving again or use PDF.",
    errEmptyFile: "That file appears empty.",
    errParseFailed: "Couldn’t read this file. Try another format or paste the text.",
    btnGenerateAbout: "Generate About section",
    paneAboutTarget: "LinkedIn",
    paneAboutHint: "About (Summary)",
    placeholderAboutOutput: "Your About section will appear here…",
    loadingAbout: "Writing your About…",
    errCvEmpty: "Add CV text, drop a file, or browse.",
    errCvTooLong: "CV is too long (max 50,000 characters).",
  },
  uk: {
    labelProfileName: "Ім’я в профілі",
    labelProfileTagline: "Підпис",
    placeholderProfileName: "Джеймі Хасл",
    placeholderProfileTagline:
      "CEO та засновник мого життя | Головний персонаж | #Зростання",
    paneSource: "Тема й нотатки",
    paneSourceHint: "Чернетка або тези",
    paneTarget: "LinkedIn",
    paneTargetHint: "Пост у LinkedIn",
    labelRaw: "Ваш вхідний текст",
    placeholderRaw:
      "напр.: спостереження з проєкту — контекст, що змінили, один урок для колег.",
    placeholderOutput: "Тут з’явиться ваш LinkedIn-допис…",
    btnTranslate: "Згенерувати пост",
    copy: "Копіювати",
    loading: "Генеруємо…",
    postNow: "щойно",
    newsTitle: "Новини LinkedIn",
    news1: "Бузворди зросли на 12% за тиждень",
    news2: "«Радію поділитися» лідирує в інтро",
    news3: "Таут-лідерство входить у потік",
    footerNote: "На базі ШІ · Не пов’язано з LinkedIn",
    footerDisclaimer:
      "@Це не оригінальна ідея; я не претендую на авторство.",
    footerCredit:
      'Зроблено з «любов’ю» до корпоративного світу — Оксана Кожан',
    copied: "Скопійовано",
    backlogOpen: "Історія",
    backlogHeading: "Ваш архів",
    backlogHint:
      "Лише в цьому браузері на цьому пристрої — не на сервері. Бачите лише ви.",
    backlogEmpty: "Поки що нічого немає.",
    backlogClear: "Очистити все",
    backlogClearConfirm: "Видалити всі збережені запити на цьому пристрої?",
    backlogLoad: "Підставити",
    backlogDeleteOne: "Прибрати з історії",
    backlogCloseAria: "Закрити",
    previewNameFallback: "Ваше ім’я",
    previewTaglineFallback: "Професійний оповідач",
    langBadgeNew: "Нове",
    modePost: "Пост",
    modeAbout: "Про себе",
    modeAriaLabel: "Режим",
    aboutCvLabel: "Ваше CV",
    aboutCvHint: "Вставте текст або перетягніть файл — PDF, Word або текст",
    labelCv: "Текст CV",
    placeholderCv: "Або вставте резюме сюди й відредагуйте перед генерацією.",
    dropzoneTitle: "Перетягніть CV сюди",
    dropzoneBrowse: "або натисніть, щоб обрати",
    dropzoneFormats: "PDF · Word (.docx) · Текст · Markdown",
    dropzonePrivacy:
      "PDF обробляються на сервері в пам’яті (не зберігаються). Word і текст — у браузері до генерації.",
    clearFileAria: "Прибрати файл",
    parsingFile: "Читаємо файл…",
    errFileTooLarge: "Файл завеликий (макс. 12 МБ).",
    errUnsupportedFormat: "Потрібен PDF, Word (.docx), текст або Markdown.",
    errDocLegacy: "Старий формат .doc не підтримується — збережіть як .docx або PDF.",
    errPdfNoText: "Не вдалося витягти текст з PDF (можливо скан). Спробуйте текст або Word.",
    errDocxNoText: "Не вдалося прочитати Word. Збережіть знову або надішліть PDF.",
    errEmptyFile: "Файл порожній.",
    errParseFailed: "Не вдалося прочитати файл. Спробуйте інший формат або вставте текст.",
    btnGenerateAbout: "Згенерувати «Про себе»",
    paneAboutTarget: "LinkedIn",
    paneAboutHint: "Про себе (Summary)",
    placeholderAboutOutput: "Тут з’явиться блок «Про себе»…",
    loadingAbout: "Пишемо ваш About…",
    errCvEmpty: "Додайте текст, перетягніть файл або оберіть через огляд.",
    errCvTooLong: "CV занадто довге (макс. 50 000 символів).",
  },
  de: {
    labelProfileName: "Anzeigename",
    labelProfileTagline: "Headline",
    placeholderProfileName: "Jamie Hustle",
    placeholderProfileTagline:
      "CEO & Gründer von My Life | Main Character Energy",
    paneSource: "Thema & Notizen",
    paneSourceHint: "Stichpunkte oder Entwurf",
    paneTarget: "LinkedIn",
    paneTargetHint: "LinkedIn-Post",
    labelRaw: "Dein Text",
    placeholderRaw:
      "z. B. Learnings aus dem letzten Projekt: Kontext, was wir geändert haben, eine konkrete Takeaway.",
    placeholderOutput: "Dein LinkedIn-Post erscheint hier…",
    btnTranslate: "Post erstellen",
    copy: "Kopieren",
    loading: "Erstelle…",
    postNow: "jetzt",
    newsTitle: "LinkedIn News",
    news1: "Buzzwords +12 % Woche für Woche",
    news2: "„Freue mich zu teilen“ bleibt Opener Nr. 1",
    news3: "Thought Leadership erreicht den Flow-Zustand",
    footerNote: "KI-gestützt · Nicht mit LinkedIn verbunden",
    footerDisclaimer:
      "@Keine Originalidee; ich erhebe keinen Besitzanspruch.",
    footerCredit:
      'Mit „Liebe“ zur Corporate World von Oksana Kozhan',
    copied: "Kopiert",
    backlogOpen: "Verlauf",
    backlogHeading: "Dein Archiv",
    backlogHint:
      "Nur in diesem Browser auf diesem Gerät — nicht auf unseren Servern. Nur du siehst das hier.",
    backlogEmpty: "Noch nichts gespeichert.",
    backlogClear: "Alles löschen",
    backlogClearConfirm: "Alle gespeicherten Eingaben auf diesem Gerät löschen?",
    backlogLoad: "Laden",
    backlogDeleteOne: "Aus Verlauf entfernen",
    backlogCloseAria: "Schließen",
    previewNameFallback: "Dein Name",
    previewTaglineFallback: "Professioneller Storyteller",
    langBadgeNew: "Neu",
    modePost: "Post",
    modeAbout: "Über mich",
    modeAriaLabel: "Tool",
    aboutCvLabel: "Dein Lebenslauf",
    aboutCvHint: "Text einfügen oder Datei ablegen — PDF, Word oder Text",
    labelCv: "CV-Text",
    placeholderCv: "Oder Lebenslauf hier einfügen und vor dem Erzeugen bearbeiten.",
    dropzoneTitle: "Lebenslauf hier ablegen",
    dropzoneBrowse: "oder tippen zum Auswählen",
    dropzoneFormats: "PDF · Word (.docx) · Klartext · Markdown",
    dropzonePrivacy:
      "PDFs werden kurz serverseitig im RAM gelesen (nicht gespeichert). Word & Text bleiben im Browser bis „Erzeugen“.",
    clearFileAria: "Datei entfernen",
    parsingFile: "Datei wird gelesen…",
    errFileTooLarge: "Datei zu groß (max. 12 MB).",
    errUnsupportedFormat: "Bitte PDF, Word (.docx), Klartext oder Markdown.",
    errDocLegacy: "Altes .doc wird nicht unterstützt — als .docx oder PDF speichern.",
    errPdfNoText: "Kein Text aus dieser PDF lesbar (evtl. Scan). Text oder Word versuchen.",
    errDocxNoText: "Word-Datei nicht lesbar. Erneut speichern oder PDF nutzen.",
    errEmptyFile: "Diese Datei scheint leer.",
    errParseFailed: "Datei konnte nicht gelesen werden. Anderes Format oder Text einfügen.",
    btnGenerateAbout: "„Über mich“ erstellen",
    paneAboutTarget: "LinkedIn",
    paneAboutHint: "Über mich (Kurzinfo)",
    placeholderAboutOutput: "Dein Über-mich-Text erscheint hier…",
    loadingAbout: "Schreibe dein Über mich…",
    errCvEmpty: "CV-Text einfügen, ablegen oder Datei wählen.",
    errCvTooLong: "CV zu lang (max. 50.000 Zeichen).",
  },
};

const LS_BACKLOG = "linklingo_backlog_v1";
const MAX_BACKLOG = 100;

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
  document.documentElement.lang =
    uiLang === "uk" ? "uk" : uiLang === "de" ? "de" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key] != null) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key] != null) el.placeholder = t[key];
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (t[key] != null) el.setAttribute("aria-label", t[key]);
  });

  const raw = document.getElementById("rawInput");
  if (raw && t.placeholderRaw) raw.placeholder = t.placeholderRaw;
  const cv = document.getElementById("cvInput");
  if (cv && t.placeholderCv) cv.placeholder = t.placeholderCv;
  requestAnimationFrame(() => fitRawInput());
}

document.querySelectorAll("[data-lang-ui]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const code = btn.getAttribute("data-lang-ui");
    uiLang = code === "uk" ? "uk" : code === "de" ? "de" : "en";
    document.querySelectorAll("[data-lang-ui]").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
    });
    applyI18n();
    syncPreviewLabels();
    if (backlogDialog?.open) renderBacklog();
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

const backlogDialog = document.getElementById("backlogDialog");
const backlogOpenBtn = document.getElementById("backlogOpenBtn");
const backlogCloseBtn = document.getElementById("backlogCloseBtn");
const backlogClearBtn = document.getElementById("backlogClearBtn");
const backlogList = document.getElementById("backlogList");
const backlogEmpty = document.getElementById("backlogEmpty");

const postPanel = document.getElementById("postPanel");
const aboutPanel = document.getElementById("aboutPanel");
const modePostTab = document.getElementById("modePostTab");
const modeAboutTab = document.getElementById("modeAboutTab");
const cvInput = document.getElementById("cvInput");
const cvFileInput = document.getElementById("cvFileInput");
const cvUploadBlock = document.getElementById("cvUploadBlock");
const cvDropzone = document.getElementById("cvDropzone");
const cvFileChip = document.getElementById("cvFileChip");
const cvFileName = document.getElementById("cvFileName");
const cvFileSize = document.getElementById("cvFileSize");
const cvFileClear = document.getElementById("cvFileClear");
const cvParseLine = document.getElementById("cvParseLine");
const aboutGenerateBtn = document.getElementById("aboutGenerateBtn");
const aboutCopyBtn = document.getElementById("aboutCopyBtn");
const aboutEmpty = document.getElementById("aboutEmpty");
const aboutResultText = document.getElementById("aboutResultText");
const aboutLoading = document.getElementById("aboutLoading");
const aboutErrorMsg = document.getElementById("aboutErrorMsg");
const aboutCard = document.getElementById("aboutCard");

let appMode = "post";

function setAppMode(mode) {
  appMode = mode === "about" ? "about" : "post";
  const isAbout = appMode === "about";
  if (postPanel) postPanel.hidden = isAbout;
  if (aboutPanel) aboutPanel.hidden = !isAbout;
  if (modePostTab) {
    modePostTab.classList.toggle("is-active", !isAbout);
    modePostTab.setAttribute("aria-selected", String(!isAbout));
  }
  if (modeAboutTab) {
    modeAboutTab.classList.toggle("is-active", isAbout);
    modeAboutTab.setAttribute("aria-selected", String(isAbout));
  }
}

function showAboutError(msg, opts = {}) {
  if (!aboutErrorMsg) return;
  const has = Boolean(msg && String(msg).trim());
  aboutErrorMsg.textContent = has ? msg : "";
  aboutErrorMsg.hidden = !has;
  aboutCard?.classList.toggle("about-card--error", has);
  if (cvUploadBlock) {
    if (!has) {
      cvUploadBlock.classList.remove("cv-upload--error");
    } else if (opts.upload) {
      cvUploadBlock.classList.add("cv-upload--error");
    } else {
      cvUploadBlock.classList.remove("cv-upload--error");
    }
  }
  if (has) {
    requestAnimationFrame(() => {
      aboutErrorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}

function setAboutResultLayout(on) {
  aboutCard?.classList.toggle("about-card--has-result", !!on);
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function parseErrorMessage(e) {
  const t = STRINGS[uiLang];
  const code = e?.code ?? e?.message;
  switch (code) {
    case "FILE_TOO_LARGE":
      return t.errFileTooLarge;
    case "UNSUPPORTED":
      return t.errUnsupportedFormat;
    case "DOC_LEGACY":
      return t.errDocLegacy;
    case "PDF_NO_TEXT":
      return t.errPdfNoText;
    case "DOCX_NO_TEXT":
      return t.errDocxNoText;
    case "EMPTY_FILE":
      return t.errEmptyFile;
    case "PARSE_FAILED":
      return t.errParseFailed;
    default:
      return t.errParseFailed;
  }
}

function clearCvFileUi() {
  if (cvFileChip) cvFileChip.hidden = true;
  if (cvParseLine) {
    cvParseLine.hidden = true;
    cvParseLine.textContent = "";
  }
  cvDropzone?.classList.remove("is-dragover", "is-busy");
  if (cvFileInput) cvFileInput.value = "";
}

async function processCvFile(file) {
  if (!file || !cvInput) return;
  const t = STRINGS[uiLang];
  showAboutError("");
  cvDropzone?.classList.add("is-busy");
  if (cvParseLine) {
    cvParseLine.textContent = t.parsingFile;
    cvParseLine.hidden = false;
  }

  try {
    const { text } = await extractCvText(file);
    cvInput.value = text;
    if (cvFileName) cvFileName.textContent = file.name;
    if (cvFileSize) cvFileSize.textContent = formatBytes(file.size);
    if (cvFileChip) cvFileChip.hidden = false;
  } catch (e) {
    showAboutError(parseErrorMessage(e), { upload: true });
    if (cvFileChip) cvFileChip.hidden = true;
  } finally {
    cvDropzone?.classList.remove("is-busy");
    if (cvParseLine) cvParseLine.hidden = true;
    if (cvFileInput) cvFileInput.value = "";
  }
}

async function generateAbout() {
  const text = cvInput?.value?.trim() ?? "";
  const t = STRINGS[uiLang];
  if (!text) {
    showAboutError(t.errCvEmpty);
    return;
  }
  if (text.length > 50000) {
    showAboutError(t.errCvTooLong);
    return;
  }

  showAboutError("");
  setAboutResultLayout(true);
  if (aboutGenerateBtn) aboutGenerateBtn.disabled = true;
  if (aboutCopyBtn) aboutCopyBtn.disabled = true;
  if (aboutResultText) aboutResultText.hidden = true;
  if (aboutEmpty) aboutEmpty.hidden = true;
  if (aboutLoading) aboutLoading.hidden = false;

  try {
    const res = await fetch("/api/about", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText: text, lang: uiLang }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const about = data.about || "";
    if (aboutResultText) aboutResultText.textContent = about;
    if (aboutResultText) aboutResultText.hidden = false;
    if (aboutEmpty) aboutEmpty.hidden = true;
    if (aboutCopyBtn) aboutCopyBtn.disabled = !about.trim();
  } catch (e) {
    showAboutError(e.message || "Request failed");
    if (aboutResultText?.textContent?.trim()) {
      if (aboutResultText) aboutResultText.hidden = false;
      if (aboutEmpty) aboutEmpty.hidden = true;
      if (aboutCopyBtn) aboutCopyBtn.disabled = false;
    } else {
      if (aboutEmpty) aboutEmpty.hidden = false;
      if (aboutResultText) aboutResultText.hidden = true;
      setAboutResultLayout(false);
    }
  } finally {
    if (aboutLoading) aboutLoading.hidden = true;
    if (aboutGenerateBtn) aboutGenerateBtn.disabled = false;
  }
}

function loadBacklog() {
  try {
    const raw = localStorage.getItem(LS_BACKLOG);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveBacklog(entries) {
  try {
    localStorage.setItem(LS_BACKLOG, JSON.stringify(entries));
  } catch {
    /* ignore quota */
  }
}

function pushBacklogEntry(question, answer) {
  const q = typeof question === "string" ? question.trim() : "";
  const a = typeof answer === "string" ? answer.trim() : "";
  if (!q) return;
  const entries = loadBacklog();
  entries.unshift({ t: Date.now(), q, a });
  saveBacklog(entries.slice(0, MAX_BACKLOG));
  renderBacklog();
}

function renderBacklog() {
  if (!backlogList || !backlogEmpty) return;
  const entries = loadBacklog();
  const t = STRINGS[uiLang];
  backlogList.innerHTML = "";
  if (backlogClearBtn) backlogClearBtn.hidden = entries.length === 0;
  if (entries.length === 0) {
    backlogList.hidden = true;
    backlogEmpty.hidden = false;
    return;
  }
  backlogList.hidden = false;
  backlogEmpty.hidden = true;
  const locale =
    uiLang === "uk" ? "uk-UA" : uiLang === "de" ? "de-DE" : "en-GB";
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "backlog-item";
    const time = document.createElement("time");
    time.className = "backlog-item-time";
    time.dateTime = new Date(entry.t).toISOString();
    time.textContent = new Date(entry.t).toLocaleString(locale, {
      dateStyle: "short",
      timeStyle: "short",
    });
    const qp = document.createElement("p");
    qp.className = "backlog-item-q";
    const text = entry.q || "";
    qp.textContent = text.length > 280 ? `${text.slice(0, 280)}…` : text;
    const actions = document.createElement("div");
    actions.className = "backlog-item-actions";
    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn-backlog-reuse";
    loadBtn.dataset.index = String(index);
    loadBtn.textContent = t.backlogLoad;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-backlog-row-del";
    delBtn.dataset.index = String(index);
    delBtn.setAttribute("aria-label", t.backlogDeleteOne);
    delBtn.textContent = "×";
    actions.append(loadBtn, delBtn);
    li.append(time, qp, actions);
    backlogList.appendChild(li);
  });
}

function loadBacklogEntry(index) {
  const entries = loadBacklog();
  const entry = entries[index];
  if (!entry || !rawInput || !resultText) return;
  rawInput.value = entry.q || "";
  resultText.textContent = entry.a || "";
  resultText.hidden = false;
  resultEmpty.hidden = true;
  copyBtn.disabled = false;
  showError("");
  setResultSplitLayout(true);
  syncPreviewLabels();
  if (resultPreviewHead) resultPreviewHead.hidden = false;
  requestAnimationFrame(() => fitRawInput());
  backlogDialog?.close();
}

function deleteBacklogAt(index) {
  const entries = loadBacklog();
  if (index < 0 || index >= entries.length) return;
  entries.splice(index, 1);
  saveBacklog(entries);
  renderBacklog();
}

function clearBacklogAll() {
  const t = STRINGS[uiLang];
  if (!confirm(t.backlogClearConfirm)) return;
  saveBacklog([]);
  renderBacklog();
}

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
  if (cvInput) cvInput.value = "";
  clearCvFileUi();
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
  if (aboutResultText) {
    aboutResultText.textContent = "";
    aboutResultText.hidden = true;
  }
  if (aboutEmpty) aboutEmpty.hidden = false;
  if (aboutLoading) aboutLoading.hidden = true;
  if (aboutCopyBtn) aboutCopyBtn.disabled = true;
  showAboutError("");
  setAboutResultLayout(false);
  showError("");
  setResultSplitLayout(false);
  requestAnimationFrame(() => fitRawInput());
}

function showError(msg) {
  if (!errorMsg) return;
  errorMsg.textContent = msg;
  const has = Boolean(msg && String(msg).trim());
  errorMsg.hidden = !has;
  translatorCard?.classList.toggle("translator--error", has);
  if (has) {
    requestAnimationFrame(() => {
      errorMsg.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
}

function setResultSplitLayout(on) {
  translatorCard?.classList.toggle("translator--has-result", !!on);
  requestAnimationFrame(() => fitRawInput());
}

async function translate() {
  const text = rawInput.value.trim();
  if (!text) {
    showError(
      uiLang === "uk"
        ? "Введіть текст."
        : uiLang === "de"
          ? "Bitte Text eingeben."
          : "Enter some text.",
    );
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
    pushBacklogEntry(text, data.result || "");
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

modePostTab?.addEventListener("click", () => setAppMode("post"));
modeAboutTab?.addEventListener("click", () => setAppMode("about"));

aboutGenerateBtn?.addEventListener("click", generateAbout);

cvFileInput?.addEventListener("change", () => {
  const file = cvFileInput.files?.[0];
  if (file) processCvFile(file);
});

cvFileClear?.addEventListener("click", () => {
  clearCvFileUi();
  showAboutError("");
});

cvDropzone?.addEventListener("dragenter", (e) => {
  e.preventDefault();
  cvDropzone.classList.add("is-dragover");
});

cvDropzone?.addEventListener("dragleave", (e) => {
  e.preventDefault();
  if (!cvDropzone.contains(e.relatedTarget)) {
    cvDropzone.classList.remove("is-dragover");
  }
});

cvDropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
});

cvDropzone?.addEventListener("drop", (e) => {
  e.preventDefault();
  cvDropzone.classList.remove("is-dragover");
  const file = e.dataTransfer.files?.[0];
  if (file) processCvFile(file);
});

cvInput?.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    generateAbout();
  }
});

aboutCopyBtn?.addEventListener("click", async () => {
  const t = STRINGS[uiLang];
  const label = aboutCopyBtn.querySelector('[data-i18n="copy"]');
  try {
    await navigator.clipboard.writeText(aboutResultText?.textContent || "");
    const prev = label ? label.textContent : "";
    if (label) label.textContent = t.copied;
    setTimeout(() => {
      if (label) label.textContent = prev;
    }, 2000);
  } catch {
    /* ignore */
  }
});

rawInput.addEventListener("input", () => fitRawInput());
rawInput.addEventListener("paste", () => requestAnimationFrame(() => fitRawInput()));
window.addEventListener("resize", () => fitRawInput());

rawInput.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    translate();
  }
});

backlogOpenBtn?.addEventListener("click", () => {
  renderBacklog();
  if (backlogDialog && typeof backlogDialog.showModal === "function") {
    backlogDialog.showModal();
  }
});

backlogCloseBtn?.addEventListener("click", () => backlogDialog?.close());

backlogDialog?.addEventListener("click", (e) => {
  if (e.target === backlogDialog) backlogDialog.close();
});

backlogClearBtn?.addEventListener("click", () => clearBacklogAll());

backlogList?.addEventListener("click", (e) => {
  const reuse = e.target.closest(".btn-backlog-reuse");
  const del = e.target.closest(".btn-backlog-row-del");
  if (reuse) {
    const i = Number.parseInt(reuse.dataset.index ?? "", 10);
    if (!Number.isNaN(i)) loadBacklogEntry(i);
  }
  if (del) {
    const i = Number.parseInt(del.dataset.index ?? "", 10);
    if (!Number.isNaN(i)) deleteBacklogAt(i);
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
