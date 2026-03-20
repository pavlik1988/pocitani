import { randomProblem, checkStep } from "./problems.js";
import { renderNumberBlocks, celebrateBlocks } from "./render.js";

/** @typedef {import('./problems.js').Problem} Problem */
/** @typedef {import('./problems.js').Level} Level */

const STORAGE_SOUND = "pocitani-sound";

/** @type {'welcome'|'game'} */
let screen = "welcome";
/** @type {Level} */
let level = 1;
/** @type {Problem | null} */
let problem = null;
/** @type {1|2|'done'} */
let phase = 1;
let wrongStreak = 0;

const el = {
  welcome: document.getElementById("screen-welcome"),
  game: document.getElementById("screen-game"),
  sound: document.getElementById("sound-enabled"),
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
  el.stepInput.focus();
}

function newProblem() {
  if (!level) return;
  const p = randomProblem(level);
  startProblem(p, false);
}

function showHint() {
  if (!problem) return;
  wrongStreak += 1;
  if (wrongStreak >= 2) {
    const target = phase === 1 ? problem.mid : problem.result;
    const verb = problem.op === "+" ? "přičti" : "odečti";
    el.feedback.textContent =
      phase === 1
        ? `Nápověda: ${verb} přesně ${phase === 1 ? problem.step1 : problem.step2}. Dostaneš ${target}.`
        : `Nápověda: ${verb} ještě ${problem.step2}. Výsledek je ${problem.result}.`;
    el.feedback.className = "feedback feedback--err";
    playSoft();
    return;
  }
  el.feedback.textContent =
    phase === 1
      ? "Zkus: kolik chybí jednotkám do další desítky? (Nebo kolik jednotek musíš odečíst dolů.)"
      : "Kolik zbývá z druhého čísla po prvním kroku?";
  el.feedback.className = "feedback";
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
      el.stepInput.value = "";
      updateStepLabels();
      setStepHint();
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
  el.feedback.className = "feedback feedback--err";
  if (wrongStreak >= 2) {
    showHint();
    return;
  }
  el.feedback.textContent =
    "Ještě to není ono — přemýšlej, kolik potřebuješ k nejbližší desítce. Můžeš použít Nápovědu.";
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
    showHint();
  });

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
  bindUi();
  showScreen("welcome");
}

init();
