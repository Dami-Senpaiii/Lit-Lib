# LitAudio Web MVP Prototype

Erste lauffähige Version der **Web-App** (mobile folgt separat in einem anderen Repository).

## Struktur
- `index.html` (Repo-Root): primärer Entry-Point für Deployments
- `web/index.html`: Bibliothek inkl. Login
- `web/app.js`: lädt Mock-Daten, Authentifizierung und rollenbasierten Werkzugriff
- `web/auth.js`: Authentifizierung, Session, Rechteprüfung und lokale Security-DB
- `web/audio-player.html` + `web/audio-player.js`: geschützter Dateizugriff für Audio
- `web/admin.html` + `web/admin.js`: Admin-Oberfläche für Benutzer/Rollen
- `web/styles.css`: responsives Styling
- `mock/*.json`: Mock-Daten für Bibliothek und Security-Seed

## Lokal starten
Aus dem Repo-Root:

```bash
python -m http.server 4173
```

Dann öffnen:

- `http://localhost:4173/` (empfohlen, entspricht Deployment)
- Optional: `http://localhost:4173/web/index.html`

## Demo-Logins
- Admin: `admin@litaudio.local` / `admin123`
- Lehrkraft: `lehrer@litaudio.local` / `teacher123`
- Schüler: `schueler@litaudio.local` / `student123`

## Deployment-Hinweise
Damit die Seite nicht mit 404 startet, liegt `index.html` im Repo-Root.

Zusätzlich sind einfache Konfigs für statische SPA-Deployments enthalten:
- `vercel.json`
- `netlify.toml`

Beide leiten unbekannte Pfade auf `/index.html` um.
