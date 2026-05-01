const QCM_URL = "./data/qcm_concours_medical_pdfs.json";
const FALLBACK_URL = "./data/medical_prompts.json";
const SAVE_KEY = "doctora_web_progress_v1";
const SESSION_KEY = "doctora_web_session_v1";

const screen = document.getElementById("screen");
const boot = document.getElementById("boot");
const reaction = document.getElementById("reaction");
const reactionImage = document.getElementById("reactionImage");
const reactionMessage = document.getElementById("reactionMessage");
const particles = document.getElementById("particles");

const stickerAssets = [
  "assets/stickers/whatsapp_reaction_01.jpg",
  "assets/stickers/whatsapp_reaction_02.jpg",
  "assets/stickers/whatsapp_reaction_03.jpg",
  "assets/stickers/whatsapp_reaction_04.jpg",
  "assets/stickers/whatsapp_reaction_05.jpg",
  "assets/stickers/whatsapp_reaction_06.jpg"
];

const correctMessages = [
  "Trop forte Dr.Baby 😌",
  "La chef a encore frappé.",
  "Bravo houbay, réponse propre.",
  "Bhal shawarma d souriyin: parfait.",
  "Dr.Baby vient de cuisiner ce QCM.",
  "Ma princesse est dangereuse aujourd’hui.",
  "Réponse validée, câlin débloqué.",
  "Spécialité validée dans le cœur avant l’examen.",
  "Ça c’est du niveau chef de service.",
  "Cerveau en mode premium, wa daba.",
  "Tbarkellah 3lik bébé.",
  "Wa daba bditi katkhla3ini.",
  "La reine des QCM est en service.",
  "Doctora, calme-toi, tu vas humilier l’examen.",
  "Réponse propre. J’applaudis en silence."
];

const reviewMessages = [
  "Wa laaaa 😭 relis doucement.",
  "Concentre-toi bébé, elle était piégeuse.",
  "Wa layhdik a had Dr.Baby.",
  "3sbtini… mais je t’aime.",
  "B3d mni fiya ADHD, on reprend lentement.",
  "Pas grave mon amour, on respire et on recommence.",
  "Erreur détectée, câlin recommandé.",
  "Nss 39el moment… comeback en préparation.",
  "Thmesti 😭 t’étais trop bien partie.",
  "Cette question a gagné le round, pas le match.",
  "La réponse a glissé comme une shawarma sans sauce.",
  "Wa laaaa, pas celle-là 😭",
  "On garde le calme, doctora.",
  "C’est faux, mais toi tu restes parfaite.",
  "Layhdik bébé, lis les petits mots pièges."
];

const nicknames = [
  "bébé",
  "hbila diali",
  "tbebeza diali",
  "nss 39el",
  "lhbiba lghaliya",
  "mon amour",
  "ma princesse",
  "mon petit nuage de joie",
  "doctora",
  "houbay",
  "la chef",
  "Dr.Baby"
];

const secretNotes = [
  {
    need: 0,
    title: "À ouvrir quand tu doutes",
    body: "Même quand tu te trompes, tu avances. Une question après l’autre, Dr.Baby."
  },
  {
    need: 25,
    title: "Après 25 QCM",
    body: "La chef est officiellement en mode entraînement. Je suis fier de toi."
  },
  {
    need: 100,
    title: "Petit secret",
    body: "Tu n’es pas juste en train de réviser. Tu construis ton futur, et moi je regarde ça en mode trop fier."
  },
  {
    need: 200,
    title: "Cadeau final",
    body: "Spécialité validée dans le cœur avant l’examen. Le reste, on va le gagner doucement."
  }
];

let prompts = [];
let contentMeta = null;
let route = "home";
let chapter = "Tous";
let session = [];
let sessionIndex = 0;
let answered = false;
let currentResult = null;

let state = loadState();

function defaultState() {
  return {
    version: 1,
    answered: 0,
    mastered: 0,
    xp: 0,
    streak: 0,
    bestStreak: 0,
    review: {},
    history: [],
    lastSeen: new Date().toISOString()
  };
}

function loadState() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") };
  } catch {
    return defaultState();
  }
}

function saveState() {
  state.lastSeen = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
    if (!Array.isArray(saved.ids)) return false;
    session = saved.ids.map((id) => prompts.find((item) => item.id === id)).filter(Boolean);
    sessionIndex = Math.min(saved.index || 0, Math.max(0, session.length - 1));
    answered = false;
    currentResult = null;
    return session.length > 0;
  } catch {
    return false;
  }
}

function saveSession() {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    ids: session.map((item) => item.id),
    index: sessionIndex
  }));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function level() {
  return Math.max(1, Math.floor(state.xp / 120) + 1);
}

function accuracy() {
  return state.answered ? Math.round((state.mastered / state.answered) * 100) : 0;
}

function reviewIDs() {
  return Object.keys(state.review).filter((id) => state.review[id] > 0);
}

function reviewPrompts() {
  const ids = new Set(reviewIDs());
  return prompts.filter((item) => ids.has(item.id));
}

function chapters() {
  return ["Tous", ...Array.from(new Set(prompts.map((item) => item.chapter))).sort((a, b) => a.localeCompare(b, "fr"))];
}

function chapterCounts() {
  return prompts.reduce((acc, item) => {
    acc[item.chapter] = (acc[item.chapter] || 0) + 1;
    return acc;
  }, {});
}

function filteredPrompts() {
  return chapter === "Tous" ? prompts : prompts.filter((item) => item.chapter === chapter);
}

function answerKeys() {
  return ["answer a", "answer b", "answer c", "answer d"];
}

function answerLabel(key) {
  const index = answerKeys().indexOf(String(key).toLowerCase());
  return index >= 0 ? String.fromCharCode(65 + index) : "?";
}

function normaliseQcm(raw) {
  if (!raw || !Array.isArray(raw.questions)) return [];
  contentMeta = raw.metadata || null;
  return raw.questions.map((item, index) => {
    const options = answerKeys()
      .map((key, optionIndex) => ({
        key,
        label: String.fromCharCode(65 + optionIndex),
        text: item[key]
      }))
      .filter((option) => String(option.text || "").trim().length > 0);

    return {
      id: String(item.id || `qcm_${index + 1}`),
      mode: "qcm",
      type: "qcm",
      chapter: inferChapter(item),
      specialty_area: readableCategory(item.category),
      difficulty: "concours",
      question: item.question,
      options,
      correct_answer: normaliseCorrectKey(item),
      short_explanation: item.explanation,
      source_file: item.source_file,
      source_page: item.source_page,
      source_section: item.source_topic,
      source_excerpt: item.explanation,
      tags: [item.category, item.source_topic].filter(Boolean),
      sticker_pool: stickerAssets
    };
  }).filter((item) => item.question && item.options.length >= 2);
}

function normaliseLegacyPrompts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && item.question && !/combien de fois|Dans quelle rubrique|fichier local/i.test(item.question))
    .map((item) => ({
      ...item,
      mode: "legacy",
      sticker_pool: stickerAssets
    }));
}

function normaliseCorrectKey(item) {
  const raw = String(item.correct_answer || "").trim().toLowerCase();
  if (answerKeys().includes(raw)) return raw;
  const byText = answerKeys().find((key) => String(item[key] || "").trim().toLowerCase() === raw);
  return byText || raw;
}

function inferChapter(item) {
  const file = String(item.source_file || "").toLowerCase();
  if (file.includes("urgence")) return "Urgences";
  if (file.includes("chirurgicale")) return "Chirurgie";
  if (file.includes("medicale") || file.includes("médicale")) return "Médecine";
  if (file.includes("biologie")) return "Biologie";
  if (file.includes("anatomie")) return "Anatomie";
  return readableCategory(item.category || item.source_topic || "Annales");
}

function readableCategory(value) {
  const text = String(value || "QCM concours")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "QCM concours";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function optionByKey(item, key) {
  return item.options?.find((option) => option.key === key) || null;
}

function formattedAnswer(item, key) {
  const option = optionByKey(item, key);
  if (!option) return "Non disponible dans les données locales.";
  return `${option.label}. ${option.text}`;
}

function sourceText(item) {
  const parts = [];
  if (item.source_file) parts.push(item.source_file);
  if (item.source_page !== undefined && item.source_page !== null && item.source_page !== "") parts.push(`page ${item.source_page}`);
  if (item.source_section) parts.push(item.source_section);
  return parts.length ? parts.join(" · ") : "Source locale intégrée";
}

function setRoute(nextRoute) {
  route = nextRoute;
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === route);
  });
  render();
}

function render() {
  if (route === "home") renderHome();
  if (route === "study") renderStudy();
  if (route === "errors") renderErrors();
  if (route === "progress") renderProgress();
  if (route === "garden") renderGarden();
  bind();
}

function renderHome() {
  const counts = chapterCounts();
  const pct = Math.min(100, Math.round((state.xp % 120) / 1.2));
  const nickname = pick(nicknames);
  const featured = pick(prompts) || {};
  const totalLabel = prompts.length ? `${prompts.length} QCM` : "QCM locaux";
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Dr.Baby · Safari iPad</span>
          <span class="pill">${escapeHtml(totalLabel)}</span>
        </div>
        <h1>Dr.Baby</h1>
        <p>Bonjour ${escapeHtml(nickname)}. De vrais QCM de concours, des corrections locales, et une petite dose de wa laaaa seulement après ta réponse.</p>
        <div class="hero-actions">
          <button class="primary" data-action="new-session">Commencer une session ✦</button>
          <button class="secondary" data-action="review-session">Revanche erreurs ↻</button>
        </div>
        <div class="avatar-orbit" aria-hidden="true"><strong>Dr</strong></div>
      </article>

      <section class="stats-grid">
        ${stat("Niveau", level(), `${state.xp % 120}/120 XP`)}
        ${stat("Série", state.streak, state.streak >= 5 ? "Wa daba bditi katkhla3ini." : "Une question à la fois.")}
        ${stat("Précision", `${accuracy()}%`, "bonnes réponses")}
        ${stat("À revoir", reviewIDs().length, "comebacks en attente")}
      </section>

      <div class="section-head">
        <h2>QCM du moment</h2>
        <span>source locale</span>
      </div>
      <article class="card feature-card">
        <div class="question-meta">
          <span class="tag">${escapeHtml(featured.chapter || "Annales")}</span>
          <span class="tag">${escapeHtml(featured.source_section || "concours")}</span>
        </div>
        <h3 class="question-title preview-title">${escapeHtml(featured.question || "Prête pour une session ?")}</h3>
        <p class="muted">Aucune réponse inventée: la correction affiche la réponse correcte, l’explication et la page locale.</p>
        <div class="progress-rail"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="action-grid">
          <button class="primary" data-action="new-session">Réviser maintenant</button>
          <button class="ghost" data-route="garden">Jardin secret</button>
        </div>
      </article>

      <div class="section-head">
        <h2>Matières</h2>
        <span>${escapeHtml(contentMeta?.title || "annales intégrées")}</span>
      </div>
      <section class="grid chapter-grid">
        ${Object.entries(counts).map(([name, count]) => `
          <button class="card ghost chapter-card" data-chapter="${escapeHtml(name)}">
            <strong>${escapeHtml(name)}</strong>
            <span class="muted">${count} QCM</span>
          </button>
        `).join("")}
      </section>
    </section>
  `;
}

function stat(title, value, detail) {
  return `
    <article class="stat">
      <small>${escapeHtml(title)}</small>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
    </article>
  `;
}

function renderStudy() {
  if (!session.length || sessionIndex >= session.length) {
    startSession(false, false);
  }
  const item = session[sessionIndex];
  if (!item) {
    renderEmpty("Aucune question", "La banque locale n’a pas encore chargé.");
    return;
  }
  const progress = Math.round(((sessionIndex + 1) / session.length) * 100);
  screen.innerHTML = `
    <section class="view">
      <article class="hero compact-hero">
        <div class="hero-top">
          <span class="eyebrow">QCM ${sessionIndex + 1}/${session.length}</span>
          <span class="pill">${escapeHtml(item.chapter)}</span>
        </div>
        <h1>QCM Dr.Baby</h1>
        <p>Lis l’énoncé, élimine les pièges, choisis la meilleure proposition. Le sticker vient après, pas avant.</p>
        <div class="progress-rail"><div class="progress-fill" style="width:${progress}%"></div></div>
      </article>

      <article class="question-card">
        <div class="question-meta">
          <span class="tag">${escapeHtml(item.specialty_area || "QCM concours")}</span>
          <span class="tag">${escapeHtml(item.source_section || item.chapter)}</span>
          <span class="tag">${escapeHtml(item.source_page ? `page ${item.source_page}` : "source locale")}</span>
        </div>
        <h2 class="question-title qcm-title">${escapeHtml(item.question)}</h2>
        <p class="question-sub">Choisis une réponse. La correction sérieuse reste claire, même si le pop-up te taquine un peu.</p>

        ${item.mode === "qcm" ? qcmAnswerPad(item) : legacyAnswerPad()}
      </article>

      ${answered ? correctionCard(item, currentResult) : studyCompanion(item)}

      ${answered ? `
        <div class="action-grid fade-in">
          <button class="primary" data-action="next">Question suivante</button>
          <button class="secondary" data-action="new-session">Nouvelle session</button>
        </div>
      ` : ""}
    </section>
  `;
}

function qcmAnswerPad(item) {
  return `
    <div class="answer-pad qcm-pad">
      ${item.options.map((option) => `
        <button class="choice qcm-option ${optionStateClass(item, option)}" data-answer="${escapeHtml(option.key)}" ${answered ? "disabled" : ""}>
          <b>${escapeHtml(option.label)}</b>
          <span>${escapeHtml(option.text)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function legacyAnswerPad() {
  return `
    <div class="answer-pad">
      <button class="choice mastered" data-answer="mastered" ${answered ? "disabled" : ""}>
        <b>Je maîtrise</b>
        <span>Plan clair, points essentiels récités.</span>
      </button>
      <button class="choice review" data-answer="review" ${answered ? "disabled" : ""}>
        <b>À revoir</b>
        <span>On la garde pour une revanche douce.</span>
      </button>
    </div>
  `;
}

function optionStateClass(item, option) {
  if (!answered || !currentResult) return "";
  const selected = option.key === currentResult.value;
  const correct = option.key === item.correct_answer;
  if (correct && selected) return "correct selected";
  if (correct) return "correct";
  if (selected) return "wrong selected";
  return "dimmed";
}

function studyCompanion(item) {
  return `
    <article class="card study-companion">
      <div class="micro-grid">
        <div class="micro"><b>1</b><span>Lis les mots exacts</span></div>
        <div class="micro"><b>2</b><span>Élimine les intrus</span></div>
        <div class="micro"><b>3</b><span>Valide sans panique</span></div>
      </div>
      <p class="muted">Source prête après ta réponse: ${escapeHtml(sourceText(item))}</p>
    </article>
  `;
}

function correctionCard(item, result) {
  if (item.mode !== "qcm") return legacySourceCard(item, result?.value || result);
  const good = Boolean(result?.mastered);
  const selected = formattedAnswer(item, result?.value);
  const correct = formattedAnswer(item, item.correct_answer);
  const explanation = item.short_explanation || "Je n’ai pas trouvé d’explication fiable dans les documents intégrés.";
  return `
    <article class="source-card ${good ? "source-good" : "source-wrong"}">
      <div class="correction-head">
        <span class="tag">${good ? "Correct" : "À corriger"}</span>
        <h3>${good ? "Très propre, Dr.Baby." : "Correction claire, sans drama."}</h3>
      </div>
      <div class="answer-review">
        <div>
          <small>Ta réponse</small>
          <p>${escapeHtml(selected)}</p>
        </div>
        <div>
          <small>Bonne réponse</small>
          <p>${escapeHtml(correct)}</p>
        </div>
      </div>
      <p><strong>Explication:</strong> ${escapeHtml(explanation)}</p>
      <p><strong>Source locale:</strong> ${escapeHtml(sourceText(item))}</p>
    </article>
  `;
}

function legacySourceCard(item, result) {
  const good = result === "mastered";
  return `
    <article class="source-card">
      <h3>${good ? "Validé" : "Marqué à revoir"}</h3>
      <p><strong>Correction fiable:</strong> ${escapeHtml(item.short_explanation || "Je n’ai pas trouvé d’explication fiable dans les documents intégrés.")}</p>
      <p><strong>Source:</strong> ${escapeHtml(sourceText(item))}</p>
      ${item.source_excerpt ? `<p><strong>Extrait:</strong> ${escapeHtml(item.source_excerpt)}</p>` : ""}
    </article>
  `;
}

function startSession(reviewOnly = false, resetRoute = true) {
  const source = reviewOnly ? reviewPrompts() : filteredPrompts();
  const safeSource = source.length ? source : prompts;
  session = shuffle(safeSource).slice(0, Math.min(10, safeSource.length));
  sessionIndex = 0;
  answered = false;
  currentResult = null;
  saveSession();
  if (resetRoute) setRoute("study");
}

function answer(value) {
  if (answered || !session[sessionIndex]) return;
  const item = session[sessionIndex];
  const mastered = item.mode === "qcm" ? value === item.correct_answer : value === "mastered";
  answered = true;
  currentResult = { value, mastered };

  state.answered += 1;
  state.xp += mastered ? 14 : 6;
  if (mastered) {
    state.mastered += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    delete state.review[item.id];
  } else {
    state.streak = 0;
    state.review[item.id] = (state.review[item.id] || 0) + 1;
  }
  state.history.unshift({
    id: item.id,
    result: mastered ? "mastered" : "review",
    answer: value,
    correct: item.correct_answer,
    chapter: item.chapter,
    topic: item.source_section,
    at: new Date().toISOString()
  });
  state.history = state.history.slice(0, 80);
  saveState();
  renderStudy();
  showReaction(mastered, item);
}

function nextQuestion() {
  sessionIndex += 1;
  answered = false;
  currentResult = null;
  saveSession();
  if (sessionIndex >= session.length) {
    renderSessionEnd();
    bind();
    return;
  }
  renderStudy();
}

function renderSessionEnd() {
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Session terminée</span>
          <span class="pill">+XP</span>
        </div>
        <h1>Bravo Dr.Baby</h1>
        <p>${state.streak >= 5 ? "La chef est injouable aujourd’hui." : "Même les questions ratées deviennent des points demain. Wa daba, comeback."}</p>
        <div class="hero-actions">
          <button class="primary" data-action="new-session">Encore une</button>
          <button class="secondary" data-route="errors">Voir erreurs</button>
        </div>
      </article>
      <section class="stats-grid">
        ${stat("Questions", state.answered, "travaillées")}
        ${stat("Meilleure série", state.bestStreak, "record")}
        ${stat("À revoir", reviewIDs().length, "en attente")}
        ${stat("Niveau", level(), "ça monte")}
      </section>
    </section>
  `;
}

function renderErrors() {
  const items = reviewPrompts().sort((a, b) => (state.review[b.id] || 0) - (state.review[a.id] || 0));
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Revanche douce</span>
          <span class="pill">${items.length} QCM</span>
        </div>
        <h1>Mes erreurs</h1>
        <p>On ne juge pas. On récupère les points, une question après l’autre. Ça c’est un comeback, houbay.</p>
        <div class="hero-actions">
          <button class="primary" data-action="review-session" ${items.length ? "" : "disabled"}>Lancer revanche</button>
          <button class="secondary" data-action="new-session">Révision normale</button>
        </div>
      </article>
      ${items.length ? `
        <div class="section-head"><h2>À revoir</h2><span>priorité douce</span></div>
        <section class="timeline">
          ${items.slice(0, 28).map((item) => timelineItem("↻", item.question, `${item.chapter} · ${item.source_section || "QCM"} · ${state.review[item.id]} fois`)).join("")}
        </section>
      ` : emptyMarkup("Rien à revoir", "La chef commence propre. Les QCM difficiles apparaîtront ici.")}
    </section>
  `;
}

function renderProgress() {
  const backup = createBackupCode();
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Progression</span>
          <span class="pill">niveau ${level()}</span>
        </div>
        <h1>Score doux</h1>
        <p>Tout reste sauvegardé dans Safari sur cet iPad. Pour GitHub Pages, la sauvegarde secrète sert de filet de sécurité.</p>
        <div class="progress-rail"><div class="progress-fill" style="width:${Math.min(100, Math.round((state.xp % 120) / 1.2))}%"></div></div>
      </article>
      <section class="stats-grid">
        ${stat("XP", state.xp, "local")}
        ${stat("QCM", state.answered, "travaillés")}
        ${stat("Réussite", `${accuracy()}%`, "bonnes réponses")}
        ${stat("Série", state.streak, "actuelle")}
      </section>

      <div class="section-head">
        <h2>Sauvegarde</h2>
        <span>sans compte</span>
      </div>
      <article class="save-card">
        <p class="muted">Copie ce code dans Notes si tu veux garder la progression même après changement d’iPad ou suppression des données Safari.</p>
        <textarea class="save-code" id="backupCode" readonly>${escapeHtml(backup)}</textarea>
        <div class="action-grid">
          <button class="primary" data-action="copy-backup">Copier sauvegarde</button>
          <button class="secondary" data-action="restore-open">Restaurer</button>
        </div>
        <div id="restoreBox" class="fade-in" hidden>
          <textarea class="save-code" id="restoreCode" placeholder="Colle la sauvegarde ici"></textarea>
          <button class="primary" data-action="restore-backup">Restaurer maintenant</button>
        </div>
      </article>

      <div class="section-head">
        <h2>Derniers efforts</h2>
        <span>${state.history.length}</span>
      </div>
      <section class="timeline">
        ${state.history.slice(0, 8).map((entry) => timelineItem(entry.result === "mastered" ? "✓" : "↻", entry.topic || entry.chapter, new Date(entry.at).toLocaleDateString("fr-FR"))).join("") || emptyMarkup("Encore vierge", "Une première session et ça commence.")}
      </section>
    </section>
  `;
}

function renderGarden() {
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Secret</span>
          <span class="pill">Dr.Baby ♡</span>
        </div>
        <h1>Jardin secret</h1>
        <p>Des petites notes qui se débloquent avec tes efforts. Simple, doux, pas trop de bruit.</p>
      </article>
      <div class="section-head"><h2>Surprises</h2><span>${state.answered} QCM</span></div>
      <section class="grid">
        ${secretNotes.map((note) => {
          const open = state.answered >= note.need;
          return `
            <article class="card secret-card" style="${open ? "" : "filter:saturate(.55);opacity:.72"}">
              <span class="tag">${open ? "Ouvert" : `${note.need - state.answered} QCM restants`}</span>
              <h3>${escapeHtml(note.title)}</h3>
              <p class="muted">${escapeHtml(open ? note.body : "Encore fermé, ma princesse. Ça se mérite doucement.")}</p>
            </article>
          `;
        }).join("")}
      </section>
      <div class="section-head"><h2>Stickers</h2><span>réactions privées</span></div>
      <section class="stats-grid">
        ${[1,2,3,4,5,6].map((n) => `
          <article class="card sticker-tile">
            <img src="./assets/stickers/whatsapp_reaction_0${n}.jpg" alt="" loading="lazy" />
          </article>
        `).join("")}
      </section>
    </section>
  `;
}

function timelineItem(icon, title, detail) {
  return `
    <article class="timeline-item">
      <i>${escapeHtml(icon)}</i>
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(detail)}</p>
      </div>
    </article>
  `;
}

function emptyMarkup(title, message) {
  return `
    <article class="card empty-state">
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
      </div>
    </article>
  `;
}

function renderEmpty(title, message) {
  screen.innerHTML = `<section class="view">${emptyMarkup(title, message)}</section>`;
}

function showReaction(mastered, item) {
  const stickers = item.sticker_pool?.length ? item.sticker_pool : stickerAssets;
  reactionImage.hidden = false;
  reactionImage.src = `./${pick(stickers)}`;
  reactionMessage.textContent = pick(mastered ? correctMessages : reviewMessages);
  reaction.classList.remove("hidden");
  if (mastered) burst();
  window.setTimeout(() => reaction.classList.add("hidden"), 2350);
}

function burst() {
  particles.innerHTML = "";
  const colors = ["#d1ad63", "#6f9679", "#d47e73", "#d9d4f4", "#fff8dc"];
  for (let i = 0; i < 34; i += 1) {
    const dot = document.createElement("i");
    dot.className = "particle";
    dot.style.left = `${46 + Math.random() * 8}%`;
    dot.style.top = `${44 + Math.random() * 12}%`;
    dot.style.setProperty("--x", `${(Math.random() - 0.5) * 360}px`);
    dot.style.setProperty("--y", `${(Math.random() - 0.8) * 420}px`);
    dot.style.background = pick(colors);
    particles.appendChild(dot);
  }
  window.setTimeout(() => { particles.innerHTML = ""; }, 950);
}

function createBackupCode() {
  const payload = JSON.stringify({ state, createdAt: new Date().toISOString() });
  return btoa(unescape(encodeURIComponent(payload)));
}

function restoreBackupCode(code) {
  const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!parsed || !parsed.state || parsed.state.version !== 1) throw new Error("bad backup");
  state = { ...defaultState(), ...parsed.state };
  saveState();
}

async function copyBackup() {
  const code = document.getElementById("backupCode")?.value || createBackupCode();
  try {
    await navigator.clipboard.writeText(code);
    toast("Sauvegarde copiée.");
  } catch {
    const input = document.getElementById("backupCode");
    input?.select();
    toast("Sélectionne le code et copie-le.");
  }
}

function toast(message) {
  reactionImage.hidden = true;
  reactionImage.removeAttribute("src");
  reactionMessage.textContent = message;
  reaction.classList.remove("hidden");
  window.setTimeout(() => reaction.classList.add("hidden"), 900);
}

function bind() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "new-session") startSession(false);
      if (action === "review-session") startSession(true);
      if (action === "next") nextQuestion();
      if (action === "copy-backup") copyBackup();
      if (action === "restore-open") {
        const box = document.getElementById("restoreBox");
        if (box) box.hidden = !box.hidden;
      }
      if (action === "restore-backup") {
        try {
          restoreBackupCode(document.getElementById("restoreCode")?.value || "");
          toast("Progression restaurée.");
          renderProgress();
          bind();
        } catch {
          toast("Sauvegarde illisible.");
        }
      }
    });
  });

  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => answer(button.dataset.answer));
  });

  document.querySelectorAll("[data-chapter]").forEach((button) => {
    button.addEventListener("click", () => {
      chapter = button.dataset.chapter;
      startSession(false);
    });
  });
}

function installBottomNav() {
  const nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "Navigation");
  nav.innerHTML = `
    <button data-route="home" class="active"><span>⌂</span>Accueil</button>
    <button data-route="study"><span>✦</span>Réviser</button>
    <button data-route="errors"><span>↻</span>Erreurs</button>
    <button data-route="progress"><span>◌</span>Score</button>
    <button data-route="garden"><span>♡</span>Secret</button>
  `;
  document.querySelector(".app").appendChild(nav);
}

async function loadQuestions() {
  try {
    const response = await fetch(QCM_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`QCM ${response.status}`);
    const raw = await response.json();
    const normalised = normaliseQcm(raw);
    if (!normalised.length) throw new Error("empty qcm bank");
    return normalised;
  } catch (qcmError) {
    const response = await fetch(FALLBACK_URL, { cache: "no-cache" });
    if (!response.ok) throw qcmError;
    return normaliseLegacyPrompts(await response.json());
  }
}

async function init() {
  installBottomNav();
  if ("storage" in navigator && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
  try {
    prompts = await loadQuestions();
    loadSession();
    saveState();
    render();
  } catch (error) {
    renderEmpty("Chargement impossible", "Les QCM locaux ne se sont pas chargés. Vérifie que le dossier data est bien publié avec l’app.");
  } finally {
    window.setTimeout(() => boot.classList.add("done"), 420);
  }
}

window.addEventListener("pagehide", saveState);
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveState();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

init();
