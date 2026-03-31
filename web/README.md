# LitAudio Web MVP Prototype

Erste lauffähige Version der **Web-App** (mobile folgt separat in einem anderen Repository).

## Struktur
- `index.html` (Repo-Root): primärer Entry-Point für Deployments
- `web/index.html`: alternativ direkt aufrufbarer Web-Prototyp
- `web/app.js`: lädt Mock-Daten und rendert Bibliothek/Filter
- `web/styles.css`: responsives Styling
- `mock/*.json`: Mock-Daten für die Bibliothek

## Lokal starten
Aus dem Repo-Root:

```bash
python -m http.server 4173
```

Dann öffnen:

- `http://localhost:4173/` (empfohlen, entspricht Deployment)
- Optional: `http://localhost:4173/web/index.html`

## Deployment-Hinweise
Damit die Seite nicht mit 404 startet, liegt `index.html` im Repo-Root.

Zusätzlich sind einfache Konfigs für statische SPA-Deployments enthalten:
- `vercel.json`
- `netlify.toml`

Beide leiten unbekannte Pfade auf `/index.html` um.
