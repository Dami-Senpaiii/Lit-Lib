# LitAudio Web MVP Prototype

Ein sehr leichter Startpunkt für die Web-App-Entwicklung mit Fokus auf Bibliothek/Discovery.

## Enthalten
- `index.html`: Basislayout mit Header, Suche und Filtern
- `app.js`: Lädt Mock-Daten und rendert Werkkarten
- `styles.css`: Responsive MVP-Styling
- `capture-screenshot.mjs`: Playwright-Fallback für UI-Screenshots

## Lokal starten
Aus dem Repo-Root:

```bash
python -m http.server 4173
```

Danach im Browser öffnen:

- `http://localhost:4173/web/index.html`

Hinweis: Die Seite lädt Daten aus `../mock/*.json`.

## Screenshot-Fallback (wenn Browser-Tools nicht verfügbar sind)
Wenn die Agent-Browsertools nicht verfügbar sind, kann ein Screenshot lokal mit Playwright erstellt werden.

1) Dev-Dependency installieren:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

2) Screenshot erzeugen:

```bash
node web/capture-screenshot.mjs http://127.0.0.1:4173/web/index.html artifacts/web-library.png
```

Das Skript wartet auf `networkidle` und speichert standardmäßig ein Full-Page-Screenshot.
