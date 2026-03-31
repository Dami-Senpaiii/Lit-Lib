# LitAudio / AurisLektüre – MVP Product Requirements Document (PRD)

## 1) Produktziel (MVP, 12 Wochen)
LitAudio liefert einen **rechtssicheren, didaktisch nutzbaren Audio-Zugang** zu kanonischer deutschsprachiger Literatur für den Schulkontext (Gymnasium/Maturität/Abitur) über:

- **Web-App (responsive)**
- **iPhone-App (Expo/React Native, MVP-Funktionsumfang)**

### North Star
> Nutzer:innen finden ein relevantes Werk in < 60 Sekunden und hören ohne Friktion an der zuletzt gespeicherten Stelle weiter.

### MVP-Erfolgskriterien
- Rechte-Gate aktiv und zuverlässig (keine Veröffentlichung ohne vollständige Rechteobjekte)
- Bibliothek + Werkdetail + stabiler Audio-Player in Produktion
- Entitlement-Logik für B2C-Abo und B2B-Schullizenz produktiv
- Kernmetriken ab Tag 1 messbar

---

## 2) Scope

### In Scope (Must-Have)
1. Auth (E-Mail/Passwort, Passwort-Reset)
2. Rollenmodell + RBAC + School-Mandantenkontext
3. Entitlements
   - B2C (aktive Subscription)
   - B2B (School License + Membership)
4. Bibliothek
   - Filter: Epoche, Autor, Werk, Klassenstufe
   - Suche: Titel/Autor
5. Werkdetailseite
   - Metadaten, Tracks, Laufzeit, Verfügbarkeitsstatus
6. Audio-Player
   - Play/Pause, Kapitel, ±15s, Speed (0.75–2.0), Sleep Timer
   - Fortschritt speichern, Resume
7. Personalisierung
   - Favoriten
   - Zuletzt gehört
8. Plattform-Admin
   - Autoren, Werke, Editionen, Tracks, Rechteobjekte
   - Schulen, Lizenzen, Nutzer:innen
   - Audit Logs
9. Publishing-Gate (Rights-Check vor Go-Live)

### Out of Scope (Phase 2+)
- Klassen-/Aufgabenverwaltung
- Quiz, Notizen, Lesezeichen im didaktischen Kontext
- Offline-Downloads
- SSO (SAML/OIDC)
- Mehrsprachige UI
- Android-App

---

## 3) Zielgruppen & Jobs-to-be-Done

### Schüler:in (B2C / via Schule)
- „Ich finde schnell die richtige Pflichtlektüre.“
- „Ich höre unterwegs weiter, ohne neu zu suchen.“

### Lehrperson (MVP: konsumierend)
- „Ich kann verlässliche Audiofassungen für Unterricht und Hausaufgaben empfehlen.“

### Schul-Admin
- „Ich vergebe Zugänge, kontrolliere Sitzkontingente und sehe den Lizenzstatus.“

### Plattform-Admin
- „Ich veröffentliche nur Inhalte mit vollständiger, gültiger Rechtekette und kann alles auditieren.“

---

## 4) User Stories & Akzeptanzkriterien

## Epic A – Zugang & Identität

### US-A1 Registrierung/Login
**Als** Schüler:in **möchte ich** mich per E-Mail/Passwort registrieren und einloggen, **damit** ich Zugriff auf meine Inhalte habe.

**Akzeptanzkriterien**
- Registrierung mit verifizierter E-Mail möglich
- Login/Logout funktioniert auf Web und iPhone
- Fehlermeldungen sind verständlich (falsches Passwort, Account gesperrt)

### US-A2 Passwort-Reset
**Als** Nutzer:in **möchte ich** mein Passwort zurücksetzen können, **damit** ich den Zugang wiederherstelle.

**Akzeptanzkriterien**
- Reset-Link mit Ablaufzeit
- Neues Passwort erfüllt Mindestanforderungen
- Alte Sessions werden invalidiert (optional im MVP: nur sensible Sessions)

---

## Epic B – Entitlements (B2C/B2B)

### US-B1 B2C Zugriff
**Als** Einzelkund:in **möchte ich** mit aktivem Abo auf freigegebene Inhalte zugreifen.

**Akzeptanzkriterien**
- Zugriff nur bei `subscription.status = active`
- Bei Ablauf: klarer Upsell/Statushinweis statt Hard Error

### US-B2 B2B Zugriff
**Als** Schulmitglied **möchte ich** über Schullizenz auf Inhalte zugreifen.

**Akzeptanzkriterien**
- Zugriff nur wenn `membership active` + `school_license active`
- Rollen gelten nur innerhalb der Schule (Mandantentrennung)

---

## Epic C – Bibliothek & Discovery

### US-C1 Filter & Suche
**Als** Nutzer:in **möchte ich** Werke nach Epoche/Autor/Klassenstufe filtern und nach Titel/Autor suchen.

**Akzeptanzkriterien**
- Kombinierte Filter mit URL-State (Web)
- Suchergebnisse < 1.5 s P95 bei MVP-Datenmenge
- Leerzustände mit hilfreichen Hinweisen

### US-C2 Werkdetail
**Als** Nutzer:in **möchte ich** alle relevanten Werkinfos sehen.

**Akzeptanzkriterien**
- Anzeige: Titel, Autor, Epoche, Synopsis, Laufzeit, Tracks, Status
- CTA „Anhören“ nur bei gültigem Entitlement + Rights-Status

---

## Epic D – Player & Progress

### US-D1 Audio-Wiedergabe
**Als** Nutzer:in **möchte ich** Audio stabil mit Lernfunktionen steuern.

**Akzeptanzkriterien**
- Funktionen: Play/Pause, Trackwechsel, ±15s, Speed, Sleep Timer
- Buffering-/Fehlerzustände sauber dargestellt

### US-D2 Resume/Fortschritt
**Als** Nutzer:in **möchte ich** später exakt weiterhören.

**Akzeptanzkriterien**
- Position wird spätestens alle 15 s bzw. bei Pause gespeichert
- „Weiterhören“-Karte zeigt letzte Werke in „Zuletzt gehört“
- Resume-Abweichung < 5 Sekunden in 95 % der Fälle

### US-D3 Favoriten
**Als** Nutzer:in **möchte ich** Werke merken.

**Akzeptanzkriterien**
- Werk als Favorit hinzufügen/entfernen
- Favoritenansicht im „Mein Bereich“

---

## Epic E – Admin & Rights Gate

### US-E1 Rights-Objekte verwalten
**Als** Plattform-Admin **möchte ich** Rechte pro Werk/Edition pflegen.

**Akzeptanzkriterien**
- Rechtearten mindestens: `public_domain_text`, `licensed_text`, `licensed_audio`, `internal_production`, `blocked`
- Felder: Territory, Validity, Evidenz-Referenz, Status

### US-E2 Publishing Gate
**Als** Plattform-Admin **möchte ich** Werke nur bei vollständiger Rechtebasis veröffentlichen.

**Akzeptanzkriterien**
- Publish-Action blockiert bei fehlenden/abgelaufenen Pflichtrechten
- Klare Fehlerliste pro fehlendem Rechteobjekt

### US-E3 Audit Logs
**Als** Compliance-Verantwortliche:r **möchte ich** kritische Admin-Aktionen nachvollziehen.

**Akzeptanzkriterien**
- Loggt: Actor, Action, Entity, Timestamp, Payload (redacted)
- Filter nach Zeitraum/Aktion/Entity

---

## 5) Nicht-funktionale Anforderungen

- **Security:** RLS + JWT Claims für Rolle/School Context
- **Datenschutz:** DSGVO-konforme Datenminimierung, Löschkonzept, Protokollierung
- **Performance:**
  - Library initial load < 2.5 s P95
  - Player start < 1.2 s P95 bei gutem Netz
- **Verfügbarkeit:** 99.5 % MVP-Ziel
- **Observability:** Error Tracking, API Latency, Player Failure Rate

---

## 6) Technischer Zielentwurf (MVP)

- Frontend Web: Next.js + TypeScript
- Mobile: React Native (Expo)
- Backend: Supabase (Postgres/Auth/Storage/RLS)
- Audio: Storage + signierte URLs (kurze TTL)
- API-Domänen:
  - `library`
  - `entitlements`
  - `progress`
  - `admin`

---

## 7) Datenmodell (MVP-relevant)

Pflichttabellen für MVP-Launch:
- `users`, `schools`, `school_licenses`, `school_memberships`
- `authors`, `literary_periods`, `works`, `work_rights`
- `audio_editions`, `audio_tracks`
- `listening_progress`, `favorites`, `subscriptions`, `audit_logs`

Wesentliche Constraints:
- Unique progress je `(user_id, edition_id, track_id)`
- FK-Integrität über Content-Hierarchie
- Entitlement als kombinierte Policy (Subscription ODER aktive School-Lizenz)

---

## 8) KPI-Framework (ab Woche 1 tracken)

Produkt-KPIs:
- Weekly Active Listeners (WAL)
- Completion Rate pro Werk
- Resume Rate
- Favoriten-Quote

Business-KPIs:
- Test → Paid Conversion (B2C)
- Aktivierungsrate pro Schullizenz (B2B)
- Seats genutzt / Seats gebucht

Qualitäts-KPIs:
- Player Error Rate
- Publish-Block-Rate (Rights Gate)
- Supporttickets pro 100 aktive Nutzer:innen

---

## 9) Risiken & Mitigation

1. **Rechtekettenfehler**
   - Mitigation: Pflichtfelder + Evidenznachweis + Publish Gate + Audit
2. **Zu dünner Startkatalog**
   - Mitigation: curricular priorisierte 60–100 Werke
3. **B2C/B2B-Entitlement-Komplexität**
   - Mitigation: zentraler Entitlement-Service + Integrationstests
4. **Datenschutz bei Schülerdaten**
   - Mitigation: Datenminimierung, RBAC, Löschkonzept, Zugriffsaudits
5. **Schwache Retention**
   - Mitigation: starker Resume-Flow + „Zuletzt gehört“ + kuratierte Einstiege

---

## 10) 12-Wochen-Umsetzungsplan

## Sprint 0 (Woche 1) – Setup & Architektur
- Monorepo-Grundstruktur, CI, Environments
- Datenmodell-Migrationen (Core Tabellen)
- Auth-Basis + Rollen/Claims-Design
- Tracking-Plan/KPI-Events definieren

**Exit-Kriterien:**
- Running Stacks (Web + Mobile + Supabase)
- Erstes End-to-End Hello-Flow mit Auth

## Sprint 1 (Woche 2–3) – Library Basics
- Autoren/Epochen/Werke CRUD (Admin minimal)
- Library Listing + Filter + Suche (Titel/Autor)
- Werkdetail (Metadaten + Trackliste)

**Exit-Kriterien:**
- Nutzer kann Werk finden und Detailseite öffnen

## Sprint 2 (Woche 4–5) – Player MVP
- Audio-Streaming über signierte URLs
- Player-Funktionen (Play/Pause, Kapitel, ±15s, Speed, Sleep)
- Progress-Speicherung + Resume + Zuletzt gehört

**Exit-Kriterien:**
- Stabiler Hörfluss auf Web + iPhone

## Sprint 3 (Woche 6–7) – Entitlements B2C/B2B
- Subscription-basierter Zugriff (B2C)
- School Membership + License (B2B)
- Guarding auf API/UI-Ebene

**Exit-Kriterien:**
- Zugriff korrekt je Nutzerstatus und Schulkontext

## Sprint 4 (Woche 8–9) – Rights Gate & Admin Härtung
- Work Rights CRUD inkl. Evidenzfeldern
- Publishing Gate mit Validierungslogik
- Audit Logs für kritische Admin-Aktionen

**Exit-Kriterien:**
- Kein Publish ohne valide Rechtekette

## Sprint 5 (Woche 10–11) – Qualität & Pilot-Readiness
- Observability, Error Tracking, Performance-Tuning
- UX-Polish (Leerzustände, Verfügbarkeitshinweise)
- Security Review (RLS, Rollen, Datenzugriff)

**Exit-Kriterien:**
- Pilotfähig für 3–5 Schulen + B2C Beta

## Sprint 6 (Woche 12) – Go-Live MVP
- Release-Kandidaten Web + iPhone
- Onboarding-Material (Lehrkräfte/Schuladmins)
- KPI-Dashboard live

**Exit-Kriterien:**
- Produktive Nutzung und KPI-Baseline erhoben

---

## 11) Release-Gates (Go/No-Go)

1. **Legal Gate:** Rechteobjekte vollständig + gültig
2. **Security Gate:** RLS/Role Tests bestanden
3. **Quality Gate:** P95-Latency und Player-Kernpfade im Zielkorridor
4. **Business Gate:** B2C/B2B Entitlements verifiziert

---

## 12) Positionierung (MVP Messaging)

- **Claim:** „Klassiker hören. Kontext verstehen. Besser lernen.“
- **Schüler:innen:** „Pflichtlektüre wird zugänglich – überall und im eigenen Lerntempo.“
- **Lehrpersonen:** „Literaturunterricht mit auditivem Zugang – strukturiert, verlässlich, einsetzbar.“
- **Schulen:** „Rechtssichere Literatur-Audio-Plattform mit zentraler Lizenz- und Nutzerverwaltung.“

