import { randomProblem, checkStep } from "./problems.js";
import { renderNumberBlocks, celebrateBlocks } from "./render.js";

/** @typedef {import('./problems.js').Problem} Problem */
/** @typedef {import('./problems.js').Level} Level */

const STORAGE_SOUND = "pocitani-sound";
const STORAGE_ANCHOR = "pocitani-anchor";

/** @type {'welcome'|'game'} */
let screen = "welcome";
/** @type {Level} */
let level = 1;
/** @type {Problem | null} */
let problem = null;
/** @type {1|2|'done'} */
let phase = 1;
let wrongStreak = 0;
/** Nejvyšší stupeň nápovědy odkrytý v aktuálním kroku (1–3). */
let hintTier = 0;

const el = {
  welcome: document.getElementById("screen-welcome"),
  game: document.getElementById("screen-game"),
  sound: document.getElementById("sound-enabled"),
  anchorToggle: document.getElementById("anchor-toggle"),
  anchorPanel: document.getElementById("anchor-panel"),
  problemText: document.getElementById("problem-text"),
  stepHint: document.getElementById("step-hint"),
  blocks: document.getElementById("blocks-area"),
  midLabel: document.getElementById("mid-label"),
  stepLabel: document.getElementById("step-label"),
  stepInput: document.getElementById("step-input"),
  btnCheck: document.getElementById("btn-check"),
  btnHint: document.getElementById("btn-hint"),
  feedback: document.getElementById("feedback"),
  stepPanel: document.getElementById("step-panel"),
  actionsDone: document.getElementById("actions-done"),
  btnNext: document.getElementById("btn-next"),
  btnAgain: document.getElementById("btn-again"),
  btnChangeLevel: document.getElementById("btn-change-level"),
  confetti: document.getElementById("confetti"),
  gameCard: document.querySelector(".screen--game .game-card"),
};

function isSoundOn() {
  return el.sound.checked;
}

function loadSoundPref() {
  try {
    el.sound.checked = localStorage.getItem(STORAGE_SOUND) === "1";
  } catch {
    el.sound.checked = false;
  }
}

function saveSoundPref() {
  try {
    localStorage.setItem(STORAGE_SOUND, el.sound.checked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function loadAnchorPref() {
  if (!el.anchorToggle) return;
  try {
    el.anchorToggle.checked = localStorage.getItem(STORAGE_ANCHOR) === "1";
  } catch {
    el.anchorToggle.checked = false;
  }
}

function saveAnchorPref() {
  if (!el.anchorToggle) return;
  try {
    localStorage.setItem(STORAGE_ANCHOR, el.anchorToggle.checked ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** @param {number} n */
function jednotkySlovo(n) {
  if (n === 1) return "jednotka";
  if (n >= 2 && n <= 4) return "jednotky";
  return "jednotek";
}

function updateAnchorPanel() {
  if (!el.anchorPanel || !el.anchorToggle) return;
  if (!el.anchorToggle.checked || !problem || phase === "done") {
    el.anchorPanel.classList.add("hidden");
    el.anchorPanel.replaceChildren();
    return;
  }

  el.anchorPanel.classList.remove("hidden");
  const frag = document.createDocumentFragment();

  if (phase === 1) {
    const u = problem.a % 10;
    const p1 = document.createElement("p");
    p1.textContent = `V čísle ${problem.a} je na konci ${u} ${jednotkySlovo(u)}.`;
    frag.appendChild(p1);
    const p2 = document.createElement("p");
    if (problem.op === "+") {
      const need = 10 - u;
      p2.textContent =
        need === 10
          ? "U jednotek už jsi na začátku „desítky“ — pokračuj podle příkladu."
          : `Do další desítky nahoru chybí přičíst ${need}.`;
    } else {
      p2.textContent =
        u === 0
          ? "Zkus sjet na nejbližší menší desítku."
          : `Na nejbližší menší desítku odečteš z jednotek ${u} (na 0 v jednotkách).`;
    }
    frag.appendChild(p2);
  } else {
    const cur = problem.mid;
    const u2 = cur % 10;
    const p1 = document.createElement("p");
    p1.textContent = `Teď jsme na čísle ${cur} — v jednotkách je ${u2} ${jednotkySlovo(u2)}.`;
    frag.appendChild(p1);
    const p2 = document.createElement("p");
    p2.textContent = `Druhé číslo v příkladu je ${problem.b}. Ve druhém kroku ho „doženeš“ k výsledku.`;
    frag.appendChild(p2);
  }

  el.anchorPanel.replaceChildren(frag);
}

function resetHintTier() {
  hintTier = 0;
}

/**
 * @param {1|2|3} tier
 * @returns {{ text: string; className: string }}
 */
function formatHint(tier) {
  const base = "feedback feedback--tip";
  if (!problem) return { text: "", className: base };
  const p = problem;
  const head = (n) => `Nápověda ${n}/3: `;

  if (tier === 1) {
    if (phase === 1) {
      if (p.op === "+") {
        return {
          text: `${head(1)}Nejdřív hledej kulaté číslo nad číslem, kde právě jsi. Spočítej, kolik musíš přičíst, abys na něj skočila.`,
          className: base,
        };
      }
      return {
        text: `${head(1)}Nejdřív sjeď na kulaté číslo pod číslem, kde právě jsi. Spočítej, kolik jednotek dolů odečteš.`,
        className: base,
      };
    }
    return {
      text: `${head(1)}Teď druhý krok: kolik ještě přičítáš nebo odečítáš z druhého čísla v příkladu?`,
      className: base,
    };
  }

  if (tier === 2) {
    if (phase === 1) {
      if (p.op === "+") {
        return {
          text: `${head(2)}Zkus se dostat na číslo ${p.mid}. Kolik k tomu potřebuješ přičíst?`,
          className: base,
        };
      }
      return {
        text: `${head(2)}Zkus se dostat na číslo ${p.mid}. Kolik k tomu potřebuješ odečíst?`,
        className: base,
      };
    }
    return {
      text: `${head(2)}Hledáme výsledek ${p.result}. Kolik ještě přičteš nebo odečteš ve druhém kroku?`,
      className: base,
    };
  }

  const target = phase === 1 ? p.mid : p.result;
  const verb = p.op === "+" ? "Přičti" : "Odečti";
  if (phase === 1) {
    return {
      text: `${head(3)}${verb} přesně ${p.step1}. Dostaneš ${target}.`,
      className: base,
    };
  }
  return {
    text: `${head(3)}${verb} ještě ${p.step2}. Úplný výsledek je ${p.result}.`,
    className: base,
  };
}

/** @param {1|2|3} tier */
function renderHintContent(tier) {
  const { text, className } = formatHint(tier);
  el.feedback.textContent = text;
  el.feedback.className = className;
}

function playTone(freq, duration = 0.08, type = "sine") {
  if (!isSoundOn()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch {
    /* ignore */
  }
}

/** Krátké pípnutí po správném prvním kroku (most na desítku). */
function playStepSuccess() {
  playTone(523, 0.06);
  window.setTimeout(() => playTone(659, 0.08), 70);
}

/**
 * Delší veselá „fanfára“ po dokončení celého příkladu (spolu s animací / confetti).
 */
function playCelebration() {
  if (!isSoundOn()) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    /** @type {{ f: number; t: number; d: number }[]} */
    const notes = [
      { f: 523.25, t: 0, d: 0.11 },
      { f: 659.25, t: 0.09, d: 0.11 },
      { f: 783.99, t: 0.18, d: 0.11 },
      { f: 1046.5, t: 0.3, d: 0.22 },
      { f: 1318.51, t: 0.48, d: 0.18 },
    ];

    notes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = f;
      const start = now + t;
      const end = start + d;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.13, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.06, start + d * 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    });

    const lastNoteEndSec = 0.48 + 0.18 + 0.05;
    window.setTimeout(() => {
      try {
        ctx.close();
      } catch {
        /* ignore */
      }
    }, lastNoteEndSec * 1000 + 80);
  } catch {
    /* ignore */
  }
}

function playSoft() {
  playTone(392, 0.05);
}

function showScreen(name) {
  screen = name;
  el.welcome.classList.toggle("hidden", name !== "welcome");
  el.game.classList.toggle("hidden", name !== "game");
}

function problemToString(p) {
  const sym = p.op === "+" ? "+" : "−";
  return `${p.a} ${sym} ${p.b}`;
}

function updateStepLabels() {
  if (!problem) return;
  if (phase === 1) {
    el.stepLabel.textContent =
      problem.op === "+"
        ? "Kolik přičteme jako první (abychom dosáhli kulatého čísla)?"
        : "Kolik nejdřív odečteme (abychom šli na kulaté číslo)?";
  } else if (phase === 2) {
    el.stepLabel.textContent =
      problem.op === "+" ? "Kolik ještě přičteme?" : "Kolik ještě odečteme?";
  }
}

function setStepHint() {
  if (!problem) return;
  if (phase === 1) {
    el.stepHint.textContent =
      problem.op === "+"
        ? "Nejdřív doplníme na nejbližší větší desítku."
        : "Nejdřív sjedeme na nejbližší menší desítku.";
  } else {
    el.stepHint.textContent =
      problem.op === "+"
        ? "Teď přičteme zbytek ke konečnému výsledku."
        : "Teď odečteme zbytek.";
  }
}

function clearFeedback() {
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
}

function spawnConfetti() {
  el.confetti.replaceChildren();
  const colors = ["#e8919c", "#7ecfc0", "#9b8ab8", "#ffd9a8", "#b8d4e8"];
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;
  const n = 36;
  for (let i = 0; i < n; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    el.confetti.appendChild(piece);
  }
  window.setTimeout(() => el.confetti.replaceChildren(), 3200);
}

function startProblem(p) {
  problem = p;
  phase = 1;
  wrongStreak = 0;
  resetHintTier();
  clearFeedback();
  el.midLabel.classList.add("hidden");
  el.midLabel.textContent = "";
  el.stepPanel.classList.remove("hidden");
  el.actionsDone.classList.add("hidden");
  el.stepInput.value = "";
  el.stepInput.disabled = false;
  el.btnCheck.disabled = false;
  el.problemText.textContent = problemToString(p);
  updateStepLabels();
  setStepHint();
  renderNumberBlocks(el.blocks, p.a);
  updateAnchorPanel();
  el.stepInput.focus();
}

function newProblem() {
  if (!level) return;
  const p = randomProblem(level);
  startProblem(p);
}

function showHintFromButton() {
  if (!problem || phase === "done") return;
  const next = Math.min(3, hintTier + 1);
  hintTier = next;
  renderHintContent(next);
  playSoft();
}

function onCheck() {
  if (!problem || phase === "done") return;
  const raw = el.stepInput.value.trim();
  if (raw === "") {
    el.feedback.textContent = "Zadej číslo a zmáčkni Zkusit.";
    el.feedback.className = "feedback feedback--err";
    playSoft();
    return;
  }
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    el.feedback.textContent = "To nevypadá jako číslo — zkus znovu.";
    el.feedback.className = "feedback feedback--err";
    playSoft();
    return;
  }

  const ok = checkStep(problem, phase, value);
  if (ok) {
    wrongStreak = 0;
    el.feedback.textContent = "Přesně tak!";
    el.feedback.className = "feedback feedback--ok";

    if (phase === 1) {
      playStepSuccess();
      el.midLabel.textContent = `Jsme na kulatém čísle: ${problem.mid}`;
      el.midLabel.classList.remove("hidden");
      renderNumberBlocks(el.blocks, problem.mid);
      phase = 2;
      wrongStreak = 0;
      resetHintTier();
      el.stepInput.value = "";
      updateStepLabels();
      setStepHint();
      updateAnchorPanel();
      el.stepInput.focus();
      return;
    }

    playCelebration();
    renderNumberBlocks(el.blocks, problem.result);
    celebrateBlocks(el.blocks);
    phase = "done";
    el.stepPanel.classList.add("hidden");
    el.actionsDone.classList.remove("hidden");
    el.stepHint.textContent = `Výsledek: ${problem.result} — skvělá práce!`;
    spawnConfetti();
    if (el.gameCard) {
      el.gameCard.classList.add("mascot-bounce");
      window.setTimeout(() => el.gameCard && el.gameCard.classList.remove("mascot-bounce"), 600);
    }
    return;
  }

  wrongStreak += 1;
  playSoft();
  if (wrongStreak >= 3) {
    hintTier = Math.max(hintTier, 3);
    renderHintContent(3);
    return;
  }
  if (wrongStreak >= 2) {
    hintTier = Math.max(hintTier, 2);
    renderHintContent(2);
    return;
  }
  el.feedback.textContent =
    "Ještě to není ono — zkus to znovu; k nejbližší desítce tě navede i tlačítko Nápověda (tři stupně).";
  el.feedback.className = "feedback feedback--err";
}

function bindUi() {
  document.querySelectorAll(".level-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lv = Number(btn.getAttribute("data-level"));
      if (lv >= 1 && lv <= 3) {
        level = /** @type {Level} */ (lv);
        showScreen("game");
        newProblem();
      }
    });
  });

  el.btnChangeLevel.addEventListener("click", () => {
    showScreen("welcome");
  });

  el.btnCheck.addEventListener("click", onCheck);
  el.stepInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onCheck();
  });

  el.btnHint.addEventListener("click", () => {
    showHintFromButton();
  });

  if (el.anchorToggle) {
    el.anchorToggle.addEventListener("change", () => {
      saveAnchorPref();
      updateAnchorPanel();
    });
  }

  el.btnNext.addEventListener("click", () => {
    newProblem();
  });

  el.btnAgain.addEventListener("click", () => {
    if (problem) startProblem(problem);
  });

  el.sound.addEventListener("change", saveSoundPref);
}

function init() {
  loadSoundPref();
  loadAnchorPref();
  bindUi();
  showScreen("welcome");
}

init();
