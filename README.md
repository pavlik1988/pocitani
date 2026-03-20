# Přes desítku — interaktivní pomůcka

Jednoduchá statická webová aplikace v češtině pro procvičování **počítání přes desítku** (most na kulaté číslo) u čísel do 100 a **odčítání dvojciferných čísel** postupně (např. 25 − 13 = nejdřív −10, pak −3). Vhodné pro děti kolem 2. třídy.

## Živá verze

Po zapnutí GitHub Pages u repozitáře bude aplikace dostupná na:

**[https://pavlik1988.github.io/pocitani/](https://pavlik1988.github.io/pocitani/)**

### První nasazení na GitHub Pages

1. V repozitáři na GitHubu: **Settings → Pages**.
2. U **Build and deployment** zvol **Source: GitHub Actions** (ne „Deploy from a branch“).
3. Push na větev `main` spustí workflow [.github/workflows/pages.yml](.github/workflows/pages.yml), který nasadí obsah kořene repozitáře.
4. Po dokončení běhu Actions zkontroluj URL v záložce **Actions** nebo v **Settings → Pages**.

## Lokální spuštění

Projekt je čistě statický (HTML, CSS, ES moduly). Prohlížeč vyžaduje **HTTP server** (kvůli modulům — `file://` nefunguje).

```bash
cd pocitadlo
python3 -m http.server 8080
```

Otevři [http://localhost:8080](http://localhost:8080).

Nebo:

```bash
npx --yes serve .
```

## Propojení s GitHubem

```bash
cd pocitadlo
git init
git remote add origin https://github.com/pavlik1988/pocitani.git
git add .
git commit -m "Initial: pomůcka Přes desítku"
git branch -M main
git push -u origin main
```

## Struktura

| Soubor / složka | Účel |
|-----------------|------|
| [index.html](index.html) | Struktura stránky, obrazovky |
| [css/styles.css](css/styles.css) | Vzhled, pastelová paleta |
| [js/problems.js](js/problems.js) | Generování příkladů (úrovně 1–3: most přes desítku; **4**: dvojciferné − dvojciferné, rozklad odčítance) |
| [js/render.js](js/render.js) | Vizualizace desítek a jednotek |
| [js/app.js](js/app.js) | Krok za krokem, nápovědy, zvuk |

## Licence

Soukromý / rodinný projekt — upravujte podle potřeby.
