/* Shared helpers for the "Nous deux" pages: sound, confetti, toast, reveal, storage. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const fmt = (n) => Math.round(n).toLocaleString("fr-FR");
  const base = document.currentScript.src.replace(/shared\/love\.js.*$/, "");
  const IMG = { lui: base + "anniversaire/img/lui.png", elle: base + "anniversaire/img/elle.png" };
  const avL = `<img class="av" src="${IMG.lui}" alt="">`, avE = `<img class="av" src="${IMG.elle}" alt="">`;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  document.body.insertAdjacentHTML("afterbegin", `<div id="lv-prog" aria-hidden="true"><i></i></div><canvas id="lv-fx" aria-hidden="true"></canvas><div id="lv-toast" role="status" aria-live="polite"></div><button id="lv-mute" aria-label="Son">🔊</button>${document.body.dataset.home === "no" ? "" : `<a id="lv-home" href="${base}nous-deux/" aria-label="Accueil">🏠</a>`}`);

  let AC = null, muted = store.get("lv-muted", false);
  $("#lv-mute").textContent = muted ? "🔇" : "🔊";
  const initAudio = () => { if (!AC) try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} };
  addEventListener("pointerdown", initAudio, { once: true });
  const tone = (f, d = .09, type = "sine", v = .1, slide = 0) => { if (muted || !AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02); };
  const S = { tone, pop: () => tone(rnd(600, 900), .07, "sine", .09, .5), msg: () => { tone(880, .06, "sine", .07); setTimeout(() => tone(1320, .08, "sine", .05), 60); }, good: () => { tone(660, .08, "triangle"); setTimeout(() => tone(990, .1, "triangle"), 70); }, bad: () => tone(200, .22, "sawtooth", .05, .6), win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .18, "triangle", .1), i * 110)), tick: () => tone(1500, .02, "square", .03), beat: () => { tone(70, .12, "sine", .3); setTimeout(() => tone(60, .14, "sine", .25), 160); } };
  $("#lv-mute").addEventListener("click", () => { muted = !muted; $("#lv-mute").textContent = muted ? "🔇" : "🔊"; store.set("lv-muted", muted); });

  let tT; const toast = (m, ms = 2600) => { const t = $("#lv-toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("show"), ms); };

  const cv = $("#lv-fx"), ctx = cv.getContext("2d"); let parts = [], raf = null;
  const size = () => { const d = devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); };
  size(); addEventListener("resize", size);
  let COL = ["#ff4f7e", "#ff8fb1", "#ffc94d", "#bff0dc", "#4f8bff", "#fff"], EMO = ["❤️", "💕", "😌", "✨", "🍬", "💖"];
  function burst(x, y, n = 50) { if (reduce) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = rnd(4, 11); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, r: Math.random() * 6, vr: rnd(-.3, .3), c: COL[i % COL.length], w: rnd(6, 12), life: 0, max: rnd(80, 130), e: i % 3 === 0 ? EMO[i % EMO.length] : null }); } if (!raf) loop(); }
  function loop() { ctx.clearRect(0, 0, innerWidth, innerHeight); parts = parts.filter(p => p.life < p.max); for (const p of parts) { p.life++; p.vy += .28; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.globalAlpha = 1 - p.life / p.max; ctx.translate(p.x, p.y); ctx.rotate(p.r); if (p.e) { ctx.font = "22px serif"; ctx.fillText(p.e, -11, 8); } else { ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); } ctx.restore(); } raf = parts.length ? requestAnimationFrame(loop) : (ctx.clearRect(0, 0, innerWidth, innerHeight), null); }
  const party = () => { burst(innerWidth * .2, innerHeight * .6, 60); setTimeout(() => burst(innerWidth * .8, innerHeight * .6, 60), 180); setTimeout(() => burst(innerWidth / 2, innerHeight * .35, 80), 360); };
  const burstAt = (el, n = 30) => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, n); };

  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter("fr", { granularity: "grapheme" }) : null;
  const gr = (t) => seg ? [...seg.segment(t)].map(x => x.segment) : Array.from(t);
  function splitTitles(root = document) { if (reduce) return; $$(".title", root).forEach(el => { if (el.dataset.split) return; el.dataset.split = 1; let ci = 0; const walk = (node) => [...node.childNodes].forEach(n => { if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(p => { if (!p) return; if (/^\s+$/.test(p)) return f.appendChild(document.createTextNode(" ")); const w = document.createElement("span"); w.className = "word"; gr(p).forEach(g => { const c = document.createElement("span"); c.className = "ch"; c.textContent = g; c.style.setProperty("--ci", ci++); w.appendChild(c); }); f.appendChild(w); }); n.replaceWith(f); } else if (n.nodeType === 1) walk(n); }); walk(el); }); }
  const onReveal = new Map(); const whenSeen = (el, fn) => { if (!el) return; const p = onReveal.get(el); onReveal.set(el, () => { p && p(); fn(); }); };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); const f = onReveal.get(e.target); f && f(); } }), { rootMargin: "0px 0px -10% 0px" });
  const reveal = (root = document) => $$("[data-reveal]", root).forEach(el => { if (!el.classList.contains("in")) io.observe(el); });
  const countUp = (root = document) => $$("[data-count]", root).forEach(el => whenSeen(el.closest("[data-reveal]") || el, () => { const end = +el.dataset.count, t0 = performance.now(); const f = (t) => { const k = Math.min(1, (t - t0) / 1500); el.textContent = fmt(end * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  let tick = false;
  addEventListener("scroll", () => { if (tick) return; tick = true; requestAnimationFrame(() => { tick = false; const max = document.documentElement.scrollHeight - innerHeight; $("#lv-prog i").style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`; }); }, { passive: true });
  const gate = (id, cb) => { const g = document.getElementById(id); if (!g) { reveal(); return; } document.body.classList.add("locked"); g.querySelector("[data-enter]").addEventListener("click", () => { initAudio(); S.pop(); setTimeout(S.win, 200); party(); setTimeout(() => { g.classList.add("gone"); document.body.classList.remove("locked"); reveal(); cb && cb(); }, 600); }); };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wa = (text) => { location.href = "https://wa.me/?text=" + encodeURIComponent(text); };
  window.L = { $, $$, rnd, fmt, IMG, avL, avE, store, S, toast, burst, burstAt, party, splitTitles, reveal, whenSeen, countUp, gate, shuffle, wa, reduce, base, setColors: (c, e) => { if (c) COL = c; if (e) EMO = e; } };
})();
