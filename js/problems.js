/**
 * @typedef {'+'|'-'} Op
 * @typedef {'tenBridge'|'splitSub'} Strategy
 * @typedef {1|2|3|4} Level
 * @typedef {Object} Problem
 * @property {Op} op
 * @property {number} a
 * @property {number} b
 * @property {number} mid
 * @property {number} step1
 * @property {number} step2
 * @property {number} result
 * @property {Level} level
 * @property {Strategy} strategy
 */

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Most přes desítku: dvojciferné ± jednociferné.
 * @param {number} a
 * @param {Op} op
 * @param {number} b
 * @param {Level} level
 * @returns {Problem | null}
 */
function buildProblem(a, op, b, level) {
  const u = a % 10;
  if (u === 0) return null;

  if (op === "+") {
    const step1 = 10 - u;
    if (b <= step1) return null;
    const mid = a + step1;
    const step2 = b - step1;
    if (step2 <= 0) return null;
    const result = a + b;
    return { op, a, b, mid, step1, step2, result, level, strategy: "tenBridge" };
  }

  const step1 = u;
  if (b <= step1) return null;
  const mid = a - step1;
  const step2 = b - step1;
  if (step2 <= 0) return null;
  const result = a - b;
  if (result < 0) return null;
  return { op, a, b, mid, step1, step2, result, level, strategy: "tenBridge" };
}

/**
 * Odčítání dvojciferného od dvojciferného: nejdřív odečti desítky z odčítance (10, 20…), pak jednotky.
 * Příklad: 25 − 13 → krok 1: −10 → 15, krok 2: −3 → 12.
 * @param {number} a
 * @param {number} b
 * @param {Level} level
 * @returns {Problem | null}
 */
function buildSplitSub(a, b, level) {
  if (a <= b) return null;
  if (b < 11 || b > 98) return null;
  const b1 = b % 10;
  if (b1 === 0) return null;
  const b10 = Math.floor(b / 10) * 10;
  const step1 = b10;
  const step2 = b1;
  if (a < b10) return null;
  const mid = a - b10;
  if (mid < step2) return null;
  const result = a - b;
  if (result < 10 || result > 99) return null;
  return {
    op: "-",
    a,
    b,
    mid,
    step1,
    step2,
    result,
    level,
    strategy: "splitSub",
  };
}

/**
 * @param {Level} level
 * @returns {Problem}
 */
export function randomProblem(level) {
  const maxAttempts = 400;
  for (let i = 0; i < maxAttempts; i += 1) {
    /** @type {Problem | null} */
    let p = null;

    if (level === 1) {
      const a = randInt(2, 18);
      const b = randInt(2, 9);
      p = buildProblem(a, "+", b, level);
      if (p && p.result <= 20) return p;
      continue;
    }

    if (level === 2) {
      const a = randInt(11, 89);
      const b = randInt(2, 9);
      const op = Math.random() < 0.5 ? "+" : "-";
      p = buildProblem(a, op, b, level);
      if (p && p.result >= 10 && p.result <= 99) return p;
      continue;
    }

    if (level === 3) {
      const a = randInt(11, 99);
      const b = randInt(2, 9);
      const op = Math.random() < 0.5 ? "+" : "-";
      p = buildProblem(a, op, b, level);
      if (p && p.result >= 10 && p.result <= 99) return p;
      continue;
    }

    if (level === 4) {
      const b = randInt(11, 78);
      if (b % 10 === 0) continue;
      const aMin = Math.max(b + 1, 22);
      const aMax = 99;
      if (aMin > aMax) continue;
      const a = randInt(aMin, aMax);
      p = buildSplitSub(a, b, level);
      if (p) return p;
    }
  }

  return randomProblemFallback(level);
}

/**
 * @param {Level} level
 * @returns {Problem}
 */
function randomProblemFallback(level) {
  if (level === 1) {
    const p = buildProblem(8, "+", 5, 1);
    if (p) return p;
  }
  if (level === 2) {
    const p2 = buildProblem(27, "+", 6, 2);
    if (p2) return { ...p2, level: 2 };
    const p2b = buildProblem(43, "-", 7, 2);
    return { ...p2b, level: 2 };
  }
  if (level === 3) {
    const p3 = buildProblem(56, "+", 8, 3);
    if (p3) return { ...p3, level: 3 };
    const p3b = buildProblem(71, "-", 6, 3);
    return { ...p3b, level: 3 };
  }
  const p4 = buildSplitSub(25, 13, 4);
  if (p4) return p4;
  const p4b = buildSplitSub(48, 26, 4);
  return p4b;
}

/**
 * @param {Problem} problem
 * @param {1|2} step
 * @param {number} value
 */
export function checkStep(problem, step, value) {
  const expected = step === 1 ? problem.step1 : problem.step2;
  return Number(value) === expected;
}
