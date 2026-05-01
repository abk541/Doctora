const DATA_URL = "./data/medical_prompts.json";
const SAVE_KEY = "doctora_web_progress_v1";
const SESSION_KEY = "doctora_web_session_v1";

const screen = document.getElementById("screen");
const boot = document.getElementById("boot");
const reaction = document.getElementById("reaction");
const reactionImage = document.getElementById("reactionImage");
const reactionMessage = document.getElementById("reactionMessage");
const particles = document.getElementById("particles");

const correctMessages = [
  "Trop forte doctora 😌",
  "La chef a encore frappé.",
  "Bravo houbay 🥹",
  "Bhal shawarma d souriyin: parfait.",
  "Réponse validée, câlin débloqué.",
  "Spécialité validée dans le cœur avant l’examen.",
  "Réponse propre, cerveau en mode premium.",
  "Wa daba bditi katkhla3ini."
];

const reviewMessages = [
  "Wa laaaa 😭 on la met à revoir.",
  "Concentre-toi bébé.",
  "Pas grave mon amour, on respire et on recommence.",
  "Erreur détectée, câlin recommandé.",
  "Cette question a gagné le round, pas le match.",
  "Ça c’est un futur comeback, houbay."
];

const nicknames = [
  "bébé",
  "lhbiba lghaliya",
  "ma princesse",
  "doctora",
  "houbay",
  "la chef"
];

const secretNotes = [
  {
    need: 0,
    title: "À ouvrir quand tu doutes",
    body: "Même quand tu te trompes, tu avances. Une question après l’autre, ma doctora."
  },
  {
    need: 25,
    title: "Après 25 sujets",
    body: "La chef est officiellement en mode entraînement. Je suis fier de toi."
  },
  {
    need: 60,
    title: "Cadeau final",
    body: "Spécialité validée dans le cœur avant l’examen. Le reste, on va le gagner doucement."
  }
];

let prompts = [];
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
    sessionIndex = saved.index || 0;
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
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Résidanat · Safari iPad</span>
          <span class="pill">${prompts.length} sujets</span>
        </div>
        <h1>Bonjour ${escapeHtml(nickname)}</h1>
        <p>Une session courte. Un vrai sujet d’annales. Une source claire. Et seulement après ta réponse: une petite réaction mignonne.</p>
        <div class="hero-actions">
          <button class="primary" data-action="new-session">Commencer ✦</button>
          <button class="secondary" data-action="review-session">Revanche erreurs ↻</button>
        </div>
        <div class="avatar-orbit" aria-hidden="true"><strong>♡</strong></div>
      </article>

      <section class="stats-grid">
        ${stat("Niveau", level(), `${state.xp % 120}/120 XP`)}
        ${stat("Série", state.streak, state.streak >= 5 ? "Wa daba bditi katkhla3ini." : "Une question à la fois.")}
        ${stat("Précision", `${accuracy()}%`, "auto-évaluation")}
        ${stat("À revoir", reviewIDs().length, "comebacks en attente")}
      </section>

      <div class="section-head">
        <h2>Session du moment</h2>
        <span>calme · efficace</span>
      </div>
      <article class="card">
        <div class="question-meta">
          <span class="tag">${escapeHtml(featured.chapter || "Annales")}</span>
          <span class="tag">source locale</span>
        </div>
        <h3 class="question-title">${escapeHtml(featured.question || "Prête pour une session ?")}</h3>
        <div class="progress-rail"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="action-grid">
          <button class="primary" data-action="new-session">Réviser maintenant</button>
          <button class="ghost" data-route="garden">Jardin secret</button>
        </div>
      </article>

      <div class="section-head">
        <h2>Rubriques</h2>
        <span>annales extraites</span>
      </div>
      <section class="grid">
        ${Object.entries(counts).map(([name, count]) => `
          <button class="card ghost chapter-card" data-chapter="${escapeHtml(name)}">
            <strong>${escapeHtml(name)}</strong>
            <span class="muted">${count} sujets</span>
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
    renderEmpty("Aucun sujet", "La banque locale n’a pas encore chargé.");
    return;
  }
  const progress = Math.round(((sessionIndex + 1) / session.length) * 100);
  screen.innerHTML = `
    <section class="view">
      <article class="hero">
        <div class="hero-top">
          <span class="eyebrow">Sujet ${sessionIndex + 1}/${session.length}</span>
          <span class="pill">${escapeHtml(item.chapter)}</span>
        </div>
        <h1>À réciter</h1>
        <p>Lis doucement. Réponds dans ta tête ou à voix haute. Puis choisis honnêtement.</p>
        <div class="progress-rail"><div class="progress-fill" style="width:${progress}%"></div></div>
      </article>

      <article class="question-card">
        <div class="question-meta">
          <span class="tag">${escapeHtml(item.difficulty || "moyen")}</span>
          <span class="tag">${escapeHtml(item.specialty_area || "Annales")}</span>
        </div>
        <h2 class="question-title">${escapeHtml(item.question)}</h2>
        <p class="question-sub">Pas de réponse inventée ici. L’app garde le suivi et cite la source locale disponible.</p>

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
      </article>

      ${answered ? "" : studyCompanion(item)}

      ${answered ? sourceCard(item, currentResult) : ""}

      ${answered ? `
        <div class="action-grid fade-in">
          <button class="primary" data-action="next">Sujet suivant</button>
          <button class="secondary" data-action="new-session">Nouvelle session</button>
        </div>
      ` : ""}
    </section>
  `;
}

function studyCompanion(item) {
  return `
    <article class="card study-companion">
      <div class="micro-grid">
        <div class="micro"><b>1</b><span>Lis lentement</span></div>
        <div class="micro"><b>2</b><span>Récite ton plan</span></div>
        <div class="micro"><b>3</b><span>Valide honnêtement</span></div>
      </div>
      <p class="muted">Source prête après ta réponse: ${escapeHtml(item.source_section || item.chapter)}</p>
    </article>
  `;
}

function sourceCard(item, result) {
  const good = result === "mastered";
  return `
    <article class="source-card">
      <h3>${good ? "Validé" : "Marqué à revoir"}</h3>
      <p><strong>Correction fiable:</strong> ${escapeHtml(item.short_explanation || "Je n’ai pas trouvé d’explication fiable dans les documents intégrés.")}</p>
      <p><strong>Source:</strong> ${escapeHtml(item.source_file || "source locale")}${item.source_section ? ` · ${escapeHtml(item.source_section)}` : ""}</p>
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

function answer(result) {
  if (answered || !session[sessionIndex]) return;
  const item = session[sessionIndex];
  answered = true;
  currentResult = result;
  const mastered = result === "mastered";

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
    result,
    chapter: item.chapter,
    at: new Date().toISOString()
  });
  state.history = state.history.slice(0, 60);
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
        <h1>Bravo houbay</h1>
        <p>${state.streak >= 5 ? "La chef est injouable aujourd’hui." : "Pas grave bébé, tu avances quand même."}</p>
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
          <span class="pill">${items.length} sujets</span>
        </div>
        <h1>Mes erreurs</h1>
        <p>On ne juge pas. On récupère les points, une question après l’autre.</p>
        <div class="hero-actions">
          <button class="primary" data-action="review-session" ${items.length ? "" : "disabled"}>Lancer revanche</button>
          <button class="secondary" data-action="new-session">Révision normale</button>
        </div>
      </article>
      ${items.length ? `
        <div class="section-head"><h2>À revoir</h2><span>priorité douce</span></div>
        <section class="timeline">
          ${items.slice(0, 28).map((item) => timelineItem("↻", item.question, `${item.chapter} · ${state.review[item.id]} fois`)).join("")}
        </section>
      ` : emptyMarkup("Rien à revoir", "La chef commence propre. Les sujets difficiles apparaîtront ici.")}
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
        ${stat("Questions", state.answered, "travaillées")}
        ${stat("Maîtrise", `${accuracy()}%`, "auto-évaluation")}
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
        ${state.history.slice(0, 8).map((entry) => timelineItem(entry.result === "mastered" ? "✓" : "↻", entry.chapter, new Date(entry.at).toLocaleDateString("fr-FR"))).join("") || emptyMarkup("Encore vierge", "Une première session et ça commence.")}
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
          <span class="pill">♡</span>
        </div>
        <h1>Jardin secret</h1>
        <p>Des petites notes qui se débloquent avec tes efforts. Simple, doux, pas trop de bruit.</p>
      </article>
      <div class="section-head"><h2>Surprises</h2><span>${state.answered} sujets</span></div>
      <section class="grid">
        ${secretNotes.map((note) => {
          const open = state.answered >= note.need;
          return `
            <article class="card" style="${open ? "" : "filter:saturate(.55);opacity:.72"}">
              <span class="tag">${open ? "Ouvert" : `${note.need - state.answered} sujets restants`}</span>
              <h3>${escapeHtml(note.title)}</h3>
              <p class="muted">${escapeHtml(open ? note.body : "Encore fermé, ma princesse. Ça se mérite doucement.")}</p>
            </article>
          `;
        }).join("")}
      </section>
      <div class="section-head"><h2>Stickers</h2><span>réactions</span></div>
      <section class="stats-grid">
        ${[1,2,3,4,5,6].map((n) => `
          <article class="card">
            <img src="./assets/stickers/whatsapp_reaction_0${n}.jpg" alt="" style="width:100%;height:150px;object-fit:contain;border-radius:18px;background:rgba(255,255,255,.38)" loading="lazy" />
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
  const stickers = item.sticker_pool?.length ? item.sticker_pool : [
    "assets/stickers/whatsapp_reaction_01.jpg",
    "assets/stickers/whatsapp_reaction_02.jpg",
    "assets/stickers/whatsapp_reaction_03.jpg",
    "assets/stickers/whatsapp_reaction_04.jpg",
    "assets/stickers/whatsapp_reaction_05.jpg",
    "assets/stickers/whatsapp_reaction_06.jpg"
  ];
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

async function init() {
  installBottomNav();
  if ("storage" in navigator && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    prompts = await response.json();
    prompts = prompts.filter((item) => item && item.question && !/combien de fois|Dans quelle rubrique|fichier local/i.test(item.question));
    loadSession();
    saveState();
    render();
  } catch (error) {
    renderEmpty("Chargement impossible", "Les sujets locaux ne se sont pas chargés. Vérifie que le dossier data est bien publié avec l’app.");
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
