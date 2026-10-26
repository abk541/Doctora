/* Dr.Baby : révision internat/résidanat. Une seule page, données dans data/qcm.json, progression en localStorage. */
(() => {
  "use strict";
  const KEY = "doctora_v2", QCM_URL = "./data/qcm.json", COURSES_URL = "./data/courses.json";
  const DAY = 864e5, INTERVALS = [0, 0, 2, 4, 8, 16, 32]; // jours par boîte de Leitner (1 = à revoir tout de suite)
  const LEVELS = { easy: "Facile", medium: "Moyen", hard: "Difficile", god: "Dr. House" };
  const LEVEL_ORDER = ["easy", "medium", "hard", "god"];
  const THEMES = [["rose", "Rose Dr.Baby", ["#ff5c8d", "#ffe3ec", "#fff4f7"]], ["menthe", "Menthe", ["#14a37f", "#d7f3e8", "#f0fbf7"]], ["lavande", "Lavande", ["#7a5cff", "#e6defe", "#f6f3ff"]], ["nuit", "Nuit", ["#ff7aa6", "#231e33", "#16131f"]], ["auto", "Auto (jour/nuit)", ["#ff5c8d", "#231e33", "#fff4f7"]]];
  const SECRETS = [
    [0, "Bienvenue dans ta nouvelle app, Dr.Baby. Toute neuve, avec des questions vérifiées une par une, juste pour toi. Tu vas tout casser. 💗"],
    [25, "25 réponses ! Quand tu t'y mets, rien ne te résiste. Petite pause câlin autorisée. 🤍"],
    [100, "100 réponses. Je suis tellement fier de toi, kbida. C'est dur, je sais, mais tu es plus forte que tous ces QCM réunis."],
    [250, "250 ! Le jour où tu seras résidente, je veux être le premier à t'appeler « Docteure ». 🩺"],
    [500, "500 questions… Tu sais ce qui est encore plus impressionnant que ton cerveau ? Ton cœur. Je t'aime."],
    [1000, "1000. MILLE. Ma hbila est une machine. Ce soir c'est moi qui invite, McDo à 2h du matin compris. 🍟"],
  ];
  const NICKS = ["bébé", "hbila diali", "tbebeza diali", "lhbiba lghaliya", "mon amour", "ma princesse", "doctora", "la chef", "Dr.Baby", "kbida"];
  const MSG = {
    ok: ["Trop forte Dr.Baby 😌", "Tbarkellah 3lik {n} ✨", "La reine des QCM est en service 👑", "Wa daba bditi katkhla3ini 😳", "Exact ! Le jury n'a qu'à bien se tenir", "Bonne réponse, {n} 💕", "Mais quel cerveau 🧠✨", "Résidanat ? Déjà dans la poche 😌", "Correct ! Je suis fier de toi, {n}", "Le chat approuve. Miaou validé 🐾"],
    streak: { 3: "3 d'affilée ! 🔥", 5: "5 de suite, appelez le doyen 🔥🔥", 8: "8 !!! Elle est inarrêtable 😳", 10: "10 d'affilée. Dr. House peut prendre sa retraite 👑" },
    ko: ["Wa laaaa 😭 relis doucement", "Pas grave {n}, on respire et on recommence", "C'est faux, mais toi tu restes parfaite 💗", "Layhdik, lis bien les petits mots pièges", "Même les profs se trompent. Lis l'explication 👇", "Le chat a vu, le chat ne dira rien 🤫", "Une erreur = une future bonne réponse. C'est la science.", "Cette question est méchante, pas toi 😾"],
    tap: ["Miaou ! (traduction : t'es la meilleure)", "Tu as bu de l'eau aujourd'hui ? 💧", "Encore 5 questions et je te fais un câlin 🐾", "Je surveille tes révisions 👀", "Pause ? Seulement après une petite session 😼", "Le docteur le plus mignon du Maroc, c'est toi", "Je ne suis PAS un hamster. Je suis un chat. Respect. 😾", "Ton chéri m'a dit de te dire qu'il t'aime 💌", "Respire. Tu sais plus de choses que tu ne crois.", "Ne lâche rien, {n} 💪", "Si tu m'appuies encore, je ronronne 😽", "On fait les erreurs du jour ? Elles t'attendent 🔁"],
    end: [[90, "Score de future major de promo 👑"], [75, "Excellent travail, {n} ✨"], [60, "C'est bien ! Encore un petit effort 💪"], [40, "On avance. Relis les explications, ça va rentrer 💗"], [0, "Journée difficile ? Pas grave, le chat t'aime quand même 🐾"]],
  };

  // ---------- état ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escA = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]).replace(/ ([?!:;»%])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  const pl = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  const fresh = () => ({ settings: { theme: "rose", sound: true, cat: true, goal: 20, nick: "random" }, cards: {}, fav: [], reports: [], days: {}, best: 0, exams: [] });
  let S = fresh();
  try { const raw = localStorage.getItem(KEY); if (raw) { const v = JSON.parse(raw); S = { ...fresh(), ...v, settings: { ...fresh().settings, ...(v.settings || {}) } }; } } catch (e) {}
  try { localStorage.removeItem("doctora_web_progress_v1"); localStorage.removeItem("doctora_web_session_v1"); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  let Q = [], BY = {}, CATS = [], COURSES = [];
  let quiz = null, timerId = null;
  const nick = () => (S.settings.nick === "random" ? pick(NICKS) : S.settings.nick);
  const fill = (m) => m.replace("{n}", nick());

  // ---------- thème, son, effets ----------
  const mq = matchMedia("(prefers-color-scheme: dark)");
  function applyTheme() {
    const t = S.settings.theme === "auto" ? (mq.matches ? "nuit" : "rose") : S.settings.theme;
    document.documentElement.dataset.theme = t;
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue("--meta").trim() || "#ff6f9a";
  }
  mq.addEventListener && mq.addEventListener("change", () => S.settings.theme === "auto" && applyTheme());

  let AC = null;
  const tone = (f, d = 0.1, type = "sine", v = 0.08) => {
    if (!S.settings.sound) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.02); } catch (e) {}
  };
  const sfx = { ok: () => { tone(660, 0.08, "triangle"); setTimeout(() => tone(990, 0.12, "triangle"), 70); }, ko: () => tone(220, 0.22, "sawtooth", 0.04), pop: () => tone(760, 0.06), win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle"), i * 110)) };

  let tT;
  const toast = (m, ms = 2600) => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("show"), ms); };
  function hearts(n = 8, from = $("#catBtn")) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = from.getBoundingClientRect(), box = $("#hearts");
    for (let i = 0; i < n; i++) { const h = document.createElement("span"); h.textContent = pick(["💗", "💕", "✨", "🐾", "💖"]); h.style.left = r.left + r.width / 2 - 11 + "px"; h.style.top = r.top + 10 + "px"; h.style.setProperty("--dx", (Math.random() * 160 - 80) + "px"); h.style.setProperty("--rot", (Math.random() * 60 - 30) + "deg"); h.style.animationDelay = i * 0.05 + "s"; box.appendChild(h); setTimeout(() => h.remove(), 1700); }
  }
  let bT, mT;
  function catSay(msg, mood = "", ms = 3200) {
    const cat = $("#cat"), b = $("#bubble");
    if (!S.settings.cat) return;
    b.textContent = msg; b.classList.add("show");
    if (document.body.classList.contains("quizzing")) ms = Math.min(ms, 2400);
    cat.classList.remove("happy", "sad", "squish"); void cat.offsetWidth; if (mood) cat.classList.add(mood);
    clearTimeout(bT); clearTimeout(mT);
    bT = setTimeout(() => b.classList.remove("show"), ms);
    mT = setTimeout(() => cat.classList.remove("happy", "sad", "squish"), 1200);
  }
  $("#catBtn").addEventListener("click", () => { sfx.pop(); catSay(fill(pick(MSG.tap)), "squish"); hearts(6); });
  const syncCat = () => { $("#cat").classList.toggle("hide", !S.settings.cat); document.body.classList.toggle("no-cat", !S.settings.cat); };

  // ---------- progression ----------
  const card = (id) => S.cards[id] || (S.cards[id] = { box: 0, due: 0, ok: 0, ko: 0, last: 0 });
  const seen = (id) => !!S.cards[id] && (S.cards[id].ok + S.cards[id].ko) > 0;
  const isDue = (id) => seen(id) && S.cards[id].due <= Date.now() && S.cards[id].box < 6;
  const dueList = () => Q.filter((q) => isDue(q.id)).sort((a, b) => S.cards[a.id].box - S.cards[b.id].box || S.cards[a.id].due - S.cards[b.id].due);
  const mastered = (id) => !!S.cards[id] && S.cards[id].box >= 4;
  const totalAnswered = () => Object.values(S.days).reduce((s, d) => s + d.n, 0);
  function record(id, ok) {
    const c = card(id), now = Date.now(), first = c.ok + c.ko === 0;
    if (ok) { c.ok++; c.box = first ? 3 : Math.min(6, Math.max(2, c.box + 1)); } else { c.ko++; c.box = 1; }
    c.due = now + INTERVALS[c.box] * DAY; c.last = now;
    const d = S.days[dayKey()] || (S.days[dayKey()] = { n: 0, ok: 0 }); d.n++; if (ok) d.ok++;
    S.best = Math.max(S.best, streakDays());
    const before = totalAnswered() - 1;
    const sec = SECRETS.find(([t]) => t > 0 && before < t && before + 1 >= t);
    save();
    return sec;
  }
  function streakDays() {
    let n = 0, t = Date.now();
    if (!S.days[dayKey(t)]) t -= DAY; // la série reste valable jusqu'à ce soir
    while (S.days[dayKey(t)] && S.days[dayKey(t)].n > 0) { n++; t -= DAY; }
    return n;
  }
  function refreshChrome() {
    $("#streak").textContent = "🔥 " + streakDays();
    const n = dueList().length, b = $("#dueBadge");
    b.hidden = !n; b.textContent = n > 99 ? "99+" : n;
  }

  // ---------- navigation ----------
  const screen = $("#screen");
  const views = {};
  function go(name, arg, push = true) {
    if (quiz && name !== "quiz" && !quiz.done) {
      if (quiz.exam && !confirm("Quitter l'examen blanc ? Tes réponses ne seront pas comptées.")) { if (location.hash !== "#/quiz") history.pushState(null, "", "#/quiz"); return; }
      stopTimer(); quiz = null;
    }
    if (name !== "quiz" && name !== "results") quiz = null;
    if (name === "subjects") lvlFilter = "all";
    document.body.classList.toggle("quizzing", name === "quiz");
    $("#bubble").classList.remove("show");
    $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    screen.innerHTML = `<div class="view">${views[name](arg)}</div>`;
    (bind[name] || (() => {}))(arg);
    const hash = "#/" + name + (arg ? "/" + arg : "");
    if (push && location.hash !== hash) history.pushState(null, "", hash);
    scrollTo(0, 0);
    refreshChrome();
  }
  // les écrans « quiz » et « results » n'ont de sens qu'en mémoire : on retombe sur l'accueil
  const route = () => { const [h, a] = location.hash.replace("#/", "").split("/"); if (!views[h] || h === "quiz" || h === "results" || (h === "subject" && !CATS.some((c) => c.id === a))) return ["home"]; return [h, a]; };
  addEventListener("popstate", () => { if (location.hash === "#/quiz" && quiz) return; const [h, a] = route(); go(h, a, false); });
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-go]"); if (t) { e.preventDefault(); sfx.pop(); go(t.dataset.go, t.dataset.arg); } });
  const bind = {};

  // ---------- écrans ----------
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || id;
  const catEmoji = (id) => (CATS.find((c) => c.id === id) || {}).emoji || "📘";
  function catStats(id, chapter) {
    const qs = Q.filter((q) => q.cat === id && (!chapter || q.chapter === chapter));
    let ok = 0, ko = 0, sn = 0, ms = 0;
    qs.forEach((q) => { const c = S.cards[q.id]; if (c) { ok += c.ok; ko += c.ko; if (c.ok + c.ko) sn++; if (c.box >= 4) ms++; } });
    return { total: qs.length, seen: sn, mastered: ms, acc: pct(ok, ok + ko), answers: ok + ko };
  }

  views.home = () => {
    const today = S.days[dayKey()] || { n: 0, ok: 0 }, goal = S.settings.goal, due = dueList().length;
    const h = new Date().getHours(), hello = h < 5 ? "Encore debout" : h < 12 ? "Bonjour" : h < 18 ? "Coucou" : "Bonsoir";
    const tot = totalAnswered(), unlocked = SECRETS.filter(([t]) => tot >= t), next = SECRETS.find(([t]) => tot < t);
    const note = unlocked[unlocked.length - 1];
    return `<div class="stack">
      <section class="hero">
        <p class="kicker" style="color:#fff;opacity:.9">${hello} ${esc(nick())} 💗</p>
        <h1>${today.n >= goal ? "Objectif du jour atteint ! 🎉" : today.n ? "On continue ?" : "Prête pour quelques QCM ?"}</h1>
        <p>${today.n} / ${goal} questions aujourd'hui${today.n ? ` · ${pct(today.ok, today.n)} % de réussite` : ""}</p>
        <div class="goal"><i style="width:${Math.min(100, pct(today.n, goal))}%"></i></div>
        <button class="btn" data-start="quick">⚡ Session rapide (10 questions)</button>
      </section>
      <div class="grid2">
        <button class="tile" data-start="review"><span class="e">🔁</span><b>Mes erreurs</b><small>${due ? `${due} question${due > 1 ? "s" : ""} à revoir` : "Rien à revoir, bravo"}</small>${due ? `<span class="pill bad">${due}</span>` : ""}</button>
        <button class="tile" data-go="subjects"><span class="e">📚</span><b>Par matière</b><small>Choisis un module et un chapitre</small></button>
        <button class="tile" data-go="exam"><span class="e">⏱️</span><b>Examen blanc</b><small>Chrono, sans correction avant la fin</small></button>
        <button class="tile" data-start="god"><span class="e">🧠</span><b>Mode Dr. House</b><small>Que des questions très difficiles</small></button>
        <button class="tile" data-start="fav"><span class="e">⭐</span><b>Favoris</b><small>${S.fav.length} question${S.fav.length > 1 ? "s" : ""} gardée${S.fav.length > 1 ? "s" : ""}</small></button>
        <button class="tile" data-go="courses"><span class="e">📄</span><b>Cours</b><small>Les PDF du programme</small></button>
      </div>
      <section class="secret">
        <p class="kicker" style="color:#ffd76a">💌 Mot secret ${unlocked.length}/${SECRETS.length}</p>
        <p class="letter" style="margin-top:8px">${esc(note[1])}</p>
        ${next ? `<p class="small lock" style="margin-top:10px">🔒 Prochain mot à ${next[0]} réponses (encore ${next[0] - tot})</p>` : ""}
        <div class="row wrap" style="margin-top:12px"><button class="btn sm ghost" data-go="secrets">Tous les mots</button><a class="btn sm ghost" href="./nous-deux/">Nos pages 💞</a></div>
      </section>
    </div>`;
  };
  bind.home = () => bindStarts();

  views.secrets = () => {
    const tot = totalAnswered();
    return `<div class="stack"><p class="kicker">Rien que pour toi</p><h1 class="h1">Les mots secrets 💌</h1><p class="muted">Ils se débloquent au fil de tes réponses.</p>
      ${SECRETS.map(([t, m]) => tot >= t ? `<div class="secret"><p class="kicker" style="color:#ffd76a">${t ? `${t} réponses` : "Bienvenue"}</p><p class="letter" style="margin-top:6px">${esc(m)}</p></div>` : `<div class="card"><p style="font-weight:800">🔒 À ${t} réponses</p><p class="muted small">Encore ${t - tot} questions…</p></div>`).join("")}
      <a class="btn block" href="./nous-deux/">Toutes nos pages 💞</a></div>`;
  };

  views.subjects = () => `<div class="stack"><p class="kicker">Réviser</p><h1 class="h1">Choisis une matière</h1>
    ${CATS.map((c) => { const st = catStats(c.id); return `<button class="subj" data-go="subject" data-arg="${c.id}"><span class="e">${c.emoji}</span><span class="t"><b>${esc(c.name)}</b><span class="small muted">${st.total} questions · ${pl(st.seen, "vue")} · ${st.answers ? st.acc + " % de réussite" : "pas encore commencé"}</span><span class="bar"><i style="width:${pct(st.seen, st.total)}%"></i></span></span><span>›</span></button>`; }).join("")}
    <button class="subj" data-start="mix"><span class="e">🎲</span><span class="t"><b>Tout mélangé</b><span class="small muted">${Q.length} questions de toutes les matières</span></span><span>›</span></button></div>`;

  let lvlFilter = "all";
  views.subject = (id) => {
    const chs = [...new Set(Q.filter((q) => q.cat === id).map((q) => q.chapter))], st = catStats(id);
    return `<div class="stack"><button class="btn sm soft" data-go="subjects">‹ Matières</button>
      <p class="kicker">${catEmoji(id)} ${esc(catName(id))}</p><h1 class="h1">${st.total} questions</h1>
      <p class="muted">${pl(st.seen, "vue")} · ${pl(st.mastered, "maîtrisée")}${st.answers ? ` · ${st.acc} % de réussite` : ""}</p>
      <p style="font-weight:800">Niveau</p>
      <div class="chips" id="lvls">${[["all", "Tous"], ...LEVEL_ORDER.map((l) => [l, LEVELS[l]])].map(([k, v]) => `<button class="chip ${lvlFilter === k ? "on" : ""}" data-l="${k}">${v}</button>`).join("")}</div>
      <button class="btn block" data-start="cat" data-cat="${id}">▶️ Toute la matière (10 questions)</button>
      <div class="card"><p class="kicker" style="margin-bottom:4px">Chapitres</p>
      ${chs.map((ch) => { const c = catStats(id, ch); return `<button class="chapter" data-start="cat" data-cat="${id}" data-ch="${escA(ch)}"><span class="t">${esc(ch)}<span class="bar ${c.mastered === c.total ? "good" : ""}"><i style="width:${pct(c.seen, c.total)}%"></i></span></span><span class="n">${c.seen}/${c.total}${c.answers ? ` · ${c.acc}%` : ""}</span><span>›</span></button>`; }).join("")}</div></div>`;
  };
  bind.subject = (id) => {
    bindStarts();
    $$("#lvls .chip").forEach((b) => b.addEventListener("click", () => { lvlFilter = b.dataset.l; sfx.pop(); $$("#lvls .chip").forEach((x) => x.classList.toggle("on", x === b)); }));
  };

  views.exam = () => `<div class="stack"><p class="kicker">Examen blanc</p><h1 class="h1">Conditions réelles ⏱️</h1>
    <p class="muted">Questions mélangées de toutes les matières, 1 minute par question, pas de correction avant la fin. Tu peux changer ta réponse tant que tu n'as pas validé.</p>
    <div class="grid2">${[[20, "20 questions", "20 min"], [40, "40 questions", "40 min"], [60, "60 questions", "1 h"], [100, "100 questions", "1 h 40"]].map(([n, t, d]) => `<button class="tile" data-start="exam" data-n="${n}"><span class="e">📝</span><b>${t}</b><small>${d}</small></button>`).join("")}</div>
    ${S.exams.length ? `<div class="card"><p class="kicker">Derniers examens</p>${S.exams.slice(-5).reverse().map((x) => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="small muted">${new Date(x.t).toLocaleDateString("fr-FR")} · ${x.n} questions</span><b>${x.score} %</b></div>`).join("")}</div>` : ""}</div>`;
  bind.exam = () => bindStarts();

  views.review = () => {
    const due = dueList(), errs = Q.filter((q) => S.cards[q.id] && S.cards[q.id].ko > 0);
    if (!errs.length) return `<div class="empty"><div class="big">🐾</div><h2 class="h2">Aucune erreur pour l'instant</h2><p class="muted">Les questions ratées arriveront ici et reviendront au bon moment (répétition espacée).</p><button class="btn" data-start="quick" style="margin-top:16px">⚡ Faire une session</button></div>`;
    const byCat = CATS.map((c) => [c, errs.filter((q) => q.cat === c.id)]).filter(([, l]) => l.length);
    return `<div class="stack"><p class="kicker">Répétition espacée</p><h1 class="h1">Mes erreurs 🔁</h1>
      <p class="muted">Une question ratée revient tout de suite, puis de plus en plus espacée quand tu la réussis (2, 4, 8, 16 jours…).</p>
      <button class="btn block" data-start="review" ${due.length ? "" : "disabled"}>${due.length ? `Revoir ${Math.min(15, due.length)} question${due.length > 1 ? "s" : ""} maintenant` : "Rien à revoir maintenant ✨"}</button>
      <div class="card"><p class="kicker">Par matière</p>${byCat.map(([c, l]) => `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line)"><span style="font-weight:700">${c.emoji} ${esc(c.name)}</span><span class="small muted">${l.length} ratée${l.length > 1 ? "s" : ""} · ${l.filter((q) => isDue(q.id)).length} à revoir</span></div>`).join("")}</div>
      <div class="card"><p class="kicker">Les plus ratées</p>${errs.sort((a, b) => S.cards[b.id].ko - S.cards[a.id].ko).slice(0, 8).map((q) => `<div class="miss"><p class="q">${esc(q.q)}</p><p class="a">✓ ${esc(q.options[q.answer])}</p><p class="x">${esc(q.explain)}</p><p class="small muted" style="margin-top:4px">Ratée ${S.cards[q.id].ko} fois · réussie ${S.cards[q.id].ok} fois</p></div>`).join("")}</div></div>`;
  };
  bind.review = () => bindStarts();

  views.stats = () => {
    const tot = totalAnswered(), ok = Object.values(S.days).reduce((s, d) => s + d.ok, 0), ms = Q.filter((q) => mastered(q.id)).length, sn = Q.filter((q) => seen(q.id)).length;
    const week = [...Array(7)].map((_, i) => { const t = Date.now() - (6 - i) * DAY, d = S.days[dayKey(t)] || { n: 0 }; return { n: d.n, l: new Date(t).toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3), today: i === 6 }; });
    const max = Math.max(5, ...week.map((w) => w.n));
    const lv = LEVEL_ORDER.map((l) => { let o = 0, k = 0; Q.filter((q) => q.level === l).forEach((q) => { const c = S.cards[q.id]; if (c) { o += c.ok; k += c.ko; } }); return [l, o, o + k]; });
    const chapters = [];
    CATS.forEach((c) => [...new Set(Q.filter((q) => q.cat === c.id).map((q) => q.chapter))].forEach((ch) => { const s = catStats(c.id, ch); if (s.answers >= 3) chapters.push([c, ch, s]); }));
    const weak = chapters.sort((a, b) => a[2].acc - b[2].acc).slice(0, 5);
    return `<div class="stack"><p class="kicker">Ta progression</p><h1 class="h1">Stats 📊</h1>
      <div class="kpis"><div class="kpi"><b>${tot}</b><span>réponses</span></div><div class="kpi"><b>${pct(ok, tot)}%</b><span>de réussite</span></div><div class="kpi"><b>${ms}</b><span>maîtrisées / ${Q.length}</span></div><div class="kpi"><b>${S.best}</b><span>${S.best > 1 ? "jours" : "jour"} de série record</span></div></div>
      <div class="card"><p class="kicker">7 derniers jours</p><div class="week">${week.map((w) => `<div class="${w.today ? "today" : ""}"><span>${w.n || ""}</span><i style="height:${(w.n / max) * 80}%"></i><span>${w.l}</span></div>`).join("")}</div></div>
      <div class="card"><p class="kicker">Par matière</p>${CATS.map((c) => { const s = catStats(c.id); return `<div style="padding:9px 0"><div class="row between"><span style="font-weight:800">${c.emoji} ${esc(c.name)}</span><span class="small muted">${s.seen}/${s.total} vue${s.seen > 1 ? "s" : ""}${s.answers ? ` · ${s.acc}%` : ""}</span></div><div class="bar ${s.acc >= 70 ? "good" : ""}"><i style="width:${s.answers ? s.acc : 0}%"></i></div></div>`; }).join("")}</div>
      <div class="card"><p class="kicker">Par niveau</p>${lv.map(([l, o, n]) => `<div class="row between" style="padding:8px 0"><span class="pill lvl-${l}">${LEVELS[l]}</span><span class="small" style="font-weight:800">${n ? `${pct(o, n)} % · ${n} réponses` : "—"}</span></div>`).join("")}</div>
      ${weak.length ? `<div class="card"><p class="kicker">À retravailler</p>${weak.map(([c, ch, s]) => `<button class="chapter" data-start="cat" data-cat="${c.id}" data-ch="${escA(ch)}"><span class="t">${c.emoji} ${esc(ch)}</span><span class="n">${s.acc}%</span><span>›</span></button>`).join("")}</div>` : ""}
      <p class="muted small center">Questions vues : ${sn} / ${Q.length}</p></div>`;
  };
  bind.stats = () => bindStarts();

  views.courses = () => `<div class="stack"><p class="kicker">Programme FMPR</p><h1 class="h1">Cours 📄</h1><p class="muted">Les PDF s'ouvrent dans un nouvel onglet et restent disponibles hors ligne une fois ouverts.</p>
    ${COURSES.map((c) => `<a class="course" href="${escA(c.file)}" target="_blank" rel="noopener"><span class="e">${c.cat ? catEmoji(c.cat) : "🗂️"}</span><span style="flex:1"><b>${esc(c.title)}</b><span class="small muted">${esc(c.summary)}</span></span><span>↗</span></a>${c.cat ? `<button class="btn sm soft" data-start="cat" data-cat="${c.cat}" style="margin:-4px 0 6px 12px">S'entraîner sur ce module</button>` : ""}`).join("")}</div>`;
  bind.courses = () => bindStarts();

  views.settings = () => {
    const st = S.settings;
    return `<div class="stack"><p class="kicker">Réglages</p><h1 class="h1">Ton app, tes règles ⚙️</h1>
      <div class="card"><p class="kicker" style="margin-bottom:10px">Thème</p><div class="themes">${THEMES.map(([k, n, c]) => `<button class="theme ${st.theme === k ? "on" : ""}" data-theme-pick="${k}" style="background:${c[2]};color:${k === "nuit" ? "#f3eefc" : "#3d2330"}"><i>${c.map((x) => `<b style="background:${x}"></b>`).join("")}</i>${n}</button>`).join("")}</div></div>
      <div class="card">
        <div class="switch">Le chat qui flotte 🐱<button class="toggle ${st.cat ? "on" : ""}" data-toggle="cat" aria-label="Chat"></button></div>
        <div class="switch">Sons<button class="toggle ${st.sound ? "on" : ""}" data-toggle="sound" aria-label="Sons"></button></div>
        <div class="switch">Objectif quotidien<select id="goal">${[10, 20, 30, 50, 80].map((n) => `<option ${st.goal === n ? "selected" : ""} value="${n}">${n} questions</option>`).join("")}</select></div>
        <div class="switch">Comment le chat t'appelle<select id="nick"><option value="random">Au hasard 🎲</option>${NICKS.map((n) => `<option ${st.nick === n ? "selected" : ""}>${n}</option>`).join("")}</select></div>
      </div>
      <div class="card stack"><p class="kicker">Sauvegarde</p><p class="small muted">Ta progression est sur ce téléphone. Fais une sauvegarde de temps en temps (ou avant de changer d'appareil).</p>
        <div class="row wrap"><button class="btn sm" id="exportBtn">⬇️ Exporter</button><label class="btn sm ghost">⬆️ Importer<input type="file" id="importInp" accept="application/json" hidden></label></div></div>
      <div class="card stack"><p class="kicker">Signalements</p><p class="small muted">${S.reports.length ? `${S.reports.length} question${S.reports.length > 1 ? "s" : ""} signalée${S.reports.length > 1 ? "s" : ""}.` : "Aucune question signalée. Si une réponse te paraît fausse, appuie sur 🚩 pendant le quiz."}</p>
        ${S.reports.length ? `<div class="row wrap"><button class="btn sm" id="sendReports">💬 Envoyer sur WhatsApp</button><button class="btn sm soft" id="clearReports">Vider</button></div>` : ""}</div>
      <div class="card stack"><p class="kicker">Zone sensible</p><button class="btn sm soft" id="resetBtn" style="color:var(--bad)">Remettre la progression à zéro</button></div>
      <p class="muted small" style="text-align:center">Dr.Baby v2 · ${Q.length} QCM vérifiés · fait avec amour 💗 · <a href="./nous-deux/">nos pages</a></p></div>`;
  };
  bind.settings = () => {
    $$("[data-theme-pick]").forEach((b) => b.addEventListener("click", () => { S.settings.theme = b.dataset.themePick; save(); applyTheme(); go("settings", null, false); catSay("Joli choix 😻", "happy", 1800); }));
    $$("[data-toggle]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.toggle; S.settings[k] = !S.settings[k]; save(); b.classList.toggle("on", S.settings[k]); syncCat(); if (k === "cat" && S.settings.cat) catSay("Je suis de retour 😽", "happy"); }));
    $("#goal").addEventListener("change", (e) => { S.settings.goal = +e.target.value; save(); toast("Objectif : " + e.target.value + " questions par jour 💪"); });
    $("#nick").addEventListener("change", (e) => { S.settings.nick = e.target.value; save(); catSay(fill("D'accord, {n} 😽"), "happy"); });
    $("#exportBtn").addEventListener("click", () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: "application/json" })); a.download = `drbaby-sauvegarde-${dayKey()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast("Sauvegarde téléchargée 💾"); });
    $("#importInp").addEventListener("change", async (e) => { const f = e.target.files[0]; if (!f) return; try { const v = JSON.parse(await f.text()); if (!v || typeof v.cards !== "object") throw 0; S = { ...fresh(), ...v, settings: { ...fresh().settings, ...(v.settings || {}) } }; save(); applyTheme(); syncCat(); toast("Progression restaurée ✅"); go("home"); } catch (err) { toast("Fichier invalide 😿"); } });
    const sr = $("#sendReports"); if (sr) sr.addEventListener("click", () => sendReports(S.reports));
    const cr = $("#clearReports"); if (cr) cr.addEventListener("click", () => { S.reports = []; save(); go("settings", null, false); });
    $("#resetBtn").addEventListener("click", () => { if (!confirm("Effacer toute la progression ? (thème et réglages conservés)")) return; S = { ...fresh(), settings: S.settings }; save(); toast("Tout est remis à zéro"); go("home"); });
  };

  // ---------- sessions ----------
  function bindStarts() { $$("[data-start]", screen).forEach((b) => b.addEventListener("click", () => { sfx.pop(); start(b.dataset.start, b.dataset); })); }
  const targetLevel = (streak) => (streak >= 6 ? "god" : streak >= 4 ? "hard" : streak >= 2 ? "medium" : "easy");
  function start(mode, d = {}) {
    let items = [], title = "", exam = false, adaptive = false, limit = 0;
    const lv = (q) => lvlFilter === "all" || q.level === lvlFilter;
    if (mode === "quick") { title = "Session rapide ⚡"; adaptive = true; items = new Array(10).fill(null); }
    else if (mode === "mix") { title = "Tout mélangé 🎲"; items = prioritise(Q).slice(0, 10); }
    else if (mode === "cat") { const pool = Q.filter((q) => q.cat === d.cat && (!d.ch || q.chapter === d.ch) && lv(q)); title = d.ch || catName(d.cat); items = prioritise(pool).slice(0, 10); if (!items.length) return toast("Aucune question pour ce filtre 🙈"); }
    else if (mode === "review") { title = "Mes erreurs 🔁"; items = dueList().slice(0, 15); if (!items.length) return toast("Rien à revoir pour l'instant ✨"); }
    else if (mode === "fav") { title = "Favoris ⭐"; items = shuffle(Q.filter((q) => S.fav.includes(q.id))); if (!items.length) return toast("Ajoute des favoris avec ⭐ pendant un quiz"); }
    else if (mode === "god") { title = "Mode Dr. House 🧠"; items = prioritise(Q.filter((q) => q.level === "god" || q.level === "hard"), true).slice(0, 10); }
    else if (mode === "exam") {
      const n = +d.n || 40; exam = true; limit = n * 60; title = `Examen blanc · ${n} questions`;
      // tirage proportionnel à la taille de chaque matière
      CATS.forEach((c) => { const pool = shuffle(Q.filter((q) => q.cat === c.id)); items.push(...pool.slice(0, Math.round((pool.length / Q.length) * n))); });
      items = shuffle(items).slice(0, n); while (items.length < n) { const q = pick(Q); if (!items.includes(q)) items.push(q); }
    }
    quiz = { mode, title, items, exam, adaptive, i: 0, answers: [], streak: 0, startedAt: Date.now(), limit, done: false };
    if (adaptive) { const tot = totalAnswered(), acc = pct(Object.values(S.days).reduce((s, x) => s + x.ok, 0), tot); quiz.streak = tot > 30 && acc > 70 ? 2 : 0; }
    go("quiz");
    if (exam) startTimer();
  }
  // non vues et à revoir d'abord, puis le reste ; mélange à l'intérieur de chaque groupe
  function prioritise(pool, hardFirst) {
    const due = shuffle(pool.filter((q) => isDue(q.id))), unseen = shuffle(pool.filter((q) => !seen(q.id))), rest = shuffle(pool.filter((q) => seen(q.id) && !isDue(q.id))).sort((a, b) => S.cards[a.id].box - S.cards[b.id].box);
    let out = [...due.slice(0, 4), ...unseen, ...due.slice(4), ...rest];
    if (hardFirst) out = [...out.filter((q) => q.level === "god"), ...out.filter((q) => q.level !== "god")];
    return out;
  }
  function nextAdaptive() {
    const used = new Set(quiz.answers.map((a) => a.id)), due = dueList().filter((q) => !used.has(q.id));
    if (due.length && Math.random() < 0.35) return due[0];
    const want = targetLevel(quiz.streak), idx = LEVEL_ORDER.indexOf(want);
    for (const l of [want, LEVEL_ORDER[idx - 1], LEVEL_ORDER[idx + 1], ...LEVEL_ORDER].filter(Boolean)) {
      const fresh = Q.filter((q) => q.level === l && !used.has(q.id) && !seen(q.id));
      if (fresh.length) return pick(fresh);
    }
    return pick(Q.filter((q) => !used.has(q.id)).sort((a, b) => (S.cards[a.id] ? S.cards[a.id].box : 0) - (S.cards[b.id] ? S.cards[b.id].box : 0)).slice(0, 30));
  }
  function current() {
    if (!quiz.items[quiz.i]) quiz.items[quiz.i] = nextAdaptive();
    const q = quiz.items[quiz.i];
    if (!quiz.order || quiz.order.id !== q.id) quiz.order = { id: q.id, perm: shuffle([0, 1, 2, 3]) };
    return q;
  }

  views.quiz = () => {
    const q = current(), n = quiz.items.length, a = quiz.answers[quiz.i], fav = S.fav.includes(q.id);
    const perm = quiz.order.perm, answered = a && !quiz.exam;
    return `<div class="qhead"><button class="btn sm soft" id="quitBtn" aria-label="Quitter">✕</button><div class="bar"><i style="width:${pct(quiz.i + (answered ? 1 : 0), n)}%"></i></div><span class="small" style="font-weight:800">${quiz.i + 1}/${n}</span>${quiz.exam ? `<span class="timer" id="timer"></span>` : ""}</div>
      <div class="qmeta"><span class="pill">${catEmoji(q.cat)} ${esc(catName(q.cat))}</span><span class="pill">${esc(q.chapter)}</span><span class="pill lvl-${q.level}">${LEVELS[q.level]}</span></div>
      <p class="question">${esc(q.q)}</p>
      <div class="opts" id="opts">${perm.map((oi, k) => {
        let cls = "";
        if (answered) cls = oi === q.answer ? "good" : oi === a.pick ? "bad" : "dim";
        else if (a && a.pick === oi) cls = "picked";
        return `<button class="opt ${cls}" data-oi="${oi}"><span class="k">${"ABCD"[k]}</span><span>${esc(q.options[oi])}</span></button>`;
      }).join("")}</div>
      ${answered ? `<div class="feedback ${a.ok ? "" : "ko"}"><h3>${a.ok ? "✅ Bonne réponse" : "❌ Pas tout à fait : la bonne réponse est en vert"}</h3><p class="exp">${esc(q.explain)}</p></div>` : ""}
      ${answered || (quiz.exam && a) ? `<div class="next-row"><button class="btn block" id="nextBtn">${quiz.i + 1 >= n ? (quiz.exam ? "Terminer l'examen" : "Voir mon score 🎉") : "Question suivante →"}</button></div>` : quiz.exam ? `<div class="next-row"><button class="btn block soft" id="skipBtn">Passer</button></div>` : ""}
      <div class="qactions"><button class="btn sm soft" id="favBtn" aria-pressed="${fav}">${fav ? "⭐ Favori" : "☆ Favori"}</button><button class="btn sm soft" id="repBtn">🚩 Signaler</button><span class="spacer"></span></div>`;
  };
  bind.quiz = () => {
    const q = current();
    $$("#opts .opt").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.oi)));
    $("#quitBtn").addEventListener("click", () => go("home"));
    $("#favBtn").addEventListener("click", () => { const i = S.fav.indexOf(q.id); if (i >= 0) S.fav.splice(i, 1); else { S.fav.push(q.id); hearts(4, $("#favBtn")); } save(); rerenderQuiz(); });
    $("#repBtn").addEventListener("click", () => report(q));
    const nb = $("#nextBtn"); if (nb) nb.addEventListener("click", next);
    const sb = $("#skipBtn"); if (sb) sb.addEventListener("click", next);
    if (quiz.exam) tickTimer();
  };
  const rerenderQuiz = () => { screen.innerHTML = `<div class="view" style="animation:none">${views.quiz()}</div>`; bind.quiz(); };
  function choose(oi) {
    const q = current(), prev = quiz.answers[quiz.i];
    if (quiz.exam) { quiz.answers[quiz.i] = { id: q.id, pick: oi, ok: oi === q.answer }; sfx.pop(); rerenderQuiz(); return; }
    if (prev) return;
    const ok = oi === q.answer;
    quiz.answers[quiz.i] = { id: q.id, pick: oi, ok };
    quiz.streak = ok ? quiz.streak + 1 : 0;
    const sec = record(q.id, ok);
    if (ok) { sfx.ok(); catSay(fill(MSG.streak[quiz.streak] || pick(MSG.ok)), "happy"); if (MSG.streak[quiz.streak]) hearts(10); }
    else { sfx.ko(); catSay(fill(pick(MSG.ko)), "sad", 3800); if (navigator.vibrate) navigator.vibrate(60); }
    rerenderQuiz();
    if (sec) setTimeout(() => { toast("💌 Nouveau mot secret débloqué !", 3200); hearts(14); }, 600);
    const nb = $("#nextBtn"); if (nb) setTimeout(() => nb.scrollIntoView({ block: "nearest", behavior: "smooth" }), 50);
  }
  function next() {
    if (quiz.i + 1 >= quiz.items.length) return finish();
    quiz.i++; quiz.order = null;
    screen.innerHTML = `<div class="view">${views.quiz()}</div>`; bind.quiz(); scrollTo({ top: 0 });
  }
  function finish() {
    stopTimer();
    if (quiz.exam) {
      quiz.items.forEach((q, i) => { const a = quiz.answers[i]; if (a) record(q.id, a.ok); });
      const ok = quiz.answers.filter((a) => a && a.ok).length;
      S.exams.push({ t: Date.now(), n: quiz.items.length, score: pct(ok, quiz.items.length) }); S.exams = S.exams.slice(-30); save();
    }
    quiz.done = true;
    go("results");
  }
  views.results = () => {
    if (!quiz) return views.home();
    const n = quiz.items.length, ok = quiz.answers.filter((a) => a && a.ok).length, p = pct(ok, n);
    const msg = fill(MSG.end.find(([t]) => p >= t)[1]);
    const misses = quiz.items.map((q, i) => [q, quiz.answers[i]]).filter(([, a]) => !a || !a.ok);
    const mins = Math.max(1, Math.round((Date.now() - quiz.startedAt) / 60000));
    return `<div class="stack" style="text-align:center"><p class="kicker">${esc(quiz.title)}</p>
      <div class="ring" style="--p:${p}"><div>${p}%</div></div>
      <h1 class="h1">${ok} / ${n}</h1><p style="font-weight:800">${esc(msg)}</p><p class="muted small">${mins} min${quiz.exam ? " · examen blanc" : ""}</p>
      <div class="row wrap" style="justify-content:center"><button class="btn" data-start="${quiz.mode === "exam" ? "quick" : quiz.mode}" data-cat="${quiz.items[0] ? quiz.items[0].cat : ""}">Encore une session</button>${misses.length ? `<button class="btn ghost" data-start="review">Revoir mes erreurs</button>` : ""}<button class="btn soft" data-go="home">Accueil</button></div>
      ${misses.length ? `<div class="card" style="text-align:left"><p class="kicker">À retenir (${misses.length})</p>${misses.map(([q, a]) => `<div class="miss"><p class="q">${esc(q.q)}</p><p class="a">✓ ${esc(q.options[q.answer])}</p>${a ? `<p class="y">✗ Ta réponse : ${esc(q.options[a.pick])}</p>` : `<p class="y">Pas de réponse</p>`}<p class="x">${esc(q.explain)}</p></div>`).join("")}</div>` : `<div class="note">Zéro faute. Le chat est officiellement impressionné. 😻</div>`}</div>`;
  };
  bind.results = () => {
    if (!quiz) return bind.home();
    bindStarts();
    const p = pct(quiz.answers.filter((a) => a && a.ok).length, quiz.items.length);
    if (p >= 70) { sfx.win(); hearts(16); }
    catSay(fill(MSG.end.find(([t]) => p >= t)[1]), p >= 60 ? "happy" : "", 4200);
  };

  // ---------- chrono ----------
  function startTimer() { stopTimer(); timerId = setInterval(tickTimer, 1000); }
  function stopTimer() { clearInterval(timerId); timerId = null; }
  function tickTimer() {
    if (!quiz || !quiz.exam) return;
    const left = Math.max(0, quiz.limit - Math.floor((Date.now() - quiz.startedAt) / 1000)), el = $("#timer");
    if (el) { el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; el.classList.toggle("low", left < 120); }
    if (left === 0 && !quiz.done) { toast("⏰ Temps écoulé !"); finish(); }
  }

  // ---------- signalement ----------
  const REASONS = ["La réponse me paraît fausse", "L'explication est fausse ou incomplète", "La question n'est pas claire", "Faute de frappe", "Autre"];
  function report(q) {
    const el = document.createElement("div");
    el.className = "sheet";
    el.innerHTML = `<div class="sheet-card" role="dialog" aria-label="Signaler"><h3>🚩 Signaler cette question</h3><p class="small muted">${esc(q.id)} · ${esc(q.q)}</p>
      <div class="reasons">${REASONS.map((r, i) => `<button class="chip ${i ? "" : "on"}" data-r="${i}">${r}</button>`).join("")}</div>
      <textarea id="repNote" rows="3" placeholder="Un commentaire ? (facultatif)"></textarea>
      <div class="row wrap"><button class="btn sm" data-act="wa">💬 Envoyer sur WhatsApp</button><button class="btn sm ghost" data-act="save">Juste enregistrer</button><button class="btn sm soft" data-act="close">Annuler</button></div></div>`;
    document.body.appendChild(el);
    let reason = REASONS[0];
    $$("[data-r]", el).forEach((b) => b.addEventListener("click", () => { reason = REASONS[+b.dataset.r]; $$("[data-r]", el).forEach((x) => x.classList.toggle("on", x === b)); }));
    el.addEventListener("click", (e) => {
      const act = e.target.dataset.act || (e.target === el ? "close" : null);
      if (!act) return;
      if (act !== "close") { const rep = { id: q.id, reason, note: $("#repNote", el).value.trim(), t: Date.now() }; S.reports.push(rep); save(); toast("Merci ! Signalement enregistré 🚩"); if (act === "wa") sendReports([rep]); }
      el.remove();
    });
  }
  function sendReports(list) {
    const txt = "🚩 Dr.Baby, questions à vérifier :\n\n" + list.map((r) => { const q = BY[r.id]; return `• ${r.id} : ${q ? q.q : ""}\n  → ${r.reason}${r.note ? " (" + r.note + ")" : ""}`; }).join("\n\n");
    location.href = "https://wa.me/?text=" + encodeURIComponent(txt);
  }

  // ---------- clavier ----------
  addEventListener("keydown", (e) => {
    if (!quiz || quiz.done || !$("#opts") || e.metaKey || e.ctrlKey || e.altKey || /input|select|textarea/i.test(e.target.tagName)) return;
    const k = e.key.toLowerCase(), idx = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
    if (idx >= 0) { const b = $$("#opts .opt")[idx]; if (b) b.click(); }
    else if (k === "enter" || k === " ") { const nb = $("#nextBtn"); if (nb) { e.preventDefault(); nb.click(); } }
  });

  // ---------- démarrage ----------
  async function boot() {
    applyTheme(); syncCat();
    screen.innerHTML = `<div class="empty"><div class="big" style="animation:float 1.6s infinite">🐱</div><p class="muted" style="font-weight:800">Préparation du cabinet Dr.Baby…</p></div>`;
    try {
      const [qr, cr] = await Promise.all([fetch(QCM_URL, { cache: "no-cache" }), fetch(COURSES_URL, { cache: "no-cache" }).catch(() => null)]);
      if (!qr.ok) throw new Error("qcm " + qr.status);
      const data = await qr.json();
      Q = data.questions; CATS = data.meta.categories; Q.forEach((q) => (BY[q.id] = q));
      if (cr && cr.ok) COURSES = (await cr.json()).courses || [];
    } catch (e) {
      screen.innerHTML = `<div class="empty"><div class="big">😿</div><h2 class="h2">Impossible de charger les questions</h2><p class="muted">Vérifie ta connexion puis réessaie.</p><button class="btn" onclick="location.reload()" style="margin-top:14px">Réessayer</button></div>`;
      return;
    }
    // nettoie les favoris/progrès qui pointeraient vers des questions supprimées
    S.fav = S.fav.filter((id) => BY[id]);
    const [h, a] = route();
    go(h, a, false);
    history.replaceState(null, "", "#/" + h + (a ? "/" + a : ""));
    const tot = totalAnswered();
    setTimeout(() => catSay(tot ? fill(dueList().length ? `Coucou {n} ! ${dueList().length} erreur${dueList().length > 1 ? "s" : ""} t'attendent 🔁` : "Coucou {n} ! On révise un peu ? 😽") : "Coucou ! Je suis ton chat de révision. Appuie sur moi quand tu veux 🐾", "happy", 4200), 700);
  }
  if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  boot();
})();
