/**
 * Vykreslí číslo jako řady po deseti (modré) a jednotky (oranžové).
 * @param {HTMLElement} container
 * @param {number} n
 */
export function renderNumberBlocks(container, n) {
  const safe = Math.max(0, Math.min(100, Math.floor(n)));
  const tens = Math.floor(safe / 10);
  const ones = safe % 10;

  const wrap = document.createElement("div");
  wrap.className = "blocks-wrap";

  for (let t = 0; t < tens; t += 1) {
    const row = document.createElement("div");
    row.className = "ten-row";
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", `Desítka ${t + 1}`);
    for (let k = 0; k < 10; k += 1) {
      const cell = document.createElement("span");
      cell.className = "block block--ten";
      row.appendChild(cell);
    }
    wrap.appendChild(row);
  }

  if (ones > 0) {
    const row = document.createElement("div");
    row.className = "ten-row";
    row.style.borderStyle = "solid";
    row.style.background = "rgba(255, 217, 168, 0.2)";
    row.setAttribute("role", "img");
    row.setAttribute("aria-label", `Jednotky: ${ones}`);
    for (let k = 0; k < ones; k += 1) {
      const cell = document.createElement("span");
      cell.className = "block";
      row.appendChild(cell);
    }
    wrap.appendChild(row);
  }

  if (tens === 0 && ones === 0) {
    const empty = document.createElement("p");
    empty.className = "step-hint";
    empty.style.margin = "0";
    empty.textContent = "Nula — zatím žádné kostičky.";
    wrap.appendChild(empty);
  }

  container.replaceChildren(wrap);
}

/**
 * Krátká oslava — přidá třídu na kontejner.
 * @param {HTMLElement} container
 */
export function celebrateBlocks(container) {
  container.classList.add("is-celebrate");
  window.setTimeout(() => container.classList.remove("is-celebrate"), 600);
}
