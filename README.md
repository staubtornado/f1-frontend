# F1 Frontend

Weboberfläche zur Anzeige von Formel-1-Saisons, Rennwochenenden, Session-Ergebnissen und Weltmeisterschaftswertungen. Die Anwendung ist als Single-Page Application mit Vue und TypeScript umgesetzt und bezieht ihre Fachdaten über eine separate Backend-API.

Dieses Repository enthält das Frontend, die Konfiguration für die lokale Entwicklung sowie einen Docker-Build mit Nginx. Das Backend und eine gemeinsame Deployment-Konfiguration sind nicht Bestandteil dieses Repositories. Diese finden sich extern.

## Funktionsumfang

- Auswahl der vom Backend bereitgestellten Saisons.
- Anzeige der Fahrer- und Teamwertung mit Positionen und Punkten.
- Navigation zu Rennwochenenden mit Veranstaltungsdaten und Session-Übersicht.
- Darstellung von Session-Ergebnissen mit Position, Fahrer, Status, Zeit, Rundenzahl und Abstand zum Führenden.
- Anzeige von Fahrerprofilen mit Name, Team, Kürzel, Startnummer und Porträt.
- Aufruf der Startaufstellung aus Grand-Prix- und Sprint-Sessions.

Die Verfügbarkeit und Vollständigkeit dieser Inhalte hängen von den Antworten des Backends ab. Das Frontend berechnet weder Wertungen noch Startpositionen selbst.

## Technische Grundlage

| Bereich | Umsetzung |
| --- | --- |
| Benutzeroberfläche | Vue 3 mit Composition API und Single-File Components (`<script setup lang="ts">`) |
| Sprache | TypeScript |
| Navigation | Vue Router mit History-Modus |
| Entwicklung und Build | Vite; Typprüfung mit `vue-tsc` |
| API-Kommunikation | Fetch API mit zentralem HTTP-Client |
| Gestaltung | Globales CSS und komponentenbezogene, gekapselte Styles |
| Containerbetrieb | Mehrstufiger Docker-Build mit Node.js und Nginx |

Die Abhängigkeiten sind in [package.json](package.json) definiert. [package-lock.json](package-lock.json) legt die mit `npm ci` installierten Versionen fest.

## Lokale Einrichtung

### Voraussetzungen

- Node.js 22 ab Version 22.12.0 und npm. Die im Lockfile enthaltenen Vite-Pakete unterstützen außerdem Node.js 20 ab Version 20.19.0.
- Ein laufendes, zur unten beschriebenen API kompatibles Backend. Die Entwicklungskonfiguration erwartet es unter `http://localhost:8000`.
- Docker, sofern das Frontend als Container betrieben werden soll.

### Installation und Entwicklungsserver

Im Stammverzeichnis des geklonten Repositories:

```bash
npm ci
npm run dev
```

Vite gibt die lokale Adresse im Terminal aus; standardmäßig ist dies `http://localhost:5173`. Ist der Port belegt, kann Vite einen anderen Port verwenden.

Die Datei [.env.development](.env.development) enthält bereits die API-Basisadresse:

```dotenv
VITE_API_BASE_URL=/api
```

In der Entwicklung leitet der Proxy aus [vite.config.ts](vite.config.ts) Anfragen an `/api` an `http://localhost:8000` weiter und entfernt dabei das Präfix `/api`. Aus einer Browseranfrage an `/api/seasons/` wird somit eine Backend-Anfrage an `/seasons/`.

### Verfügbare Befehle

| Befehl | Zweck |
| --- | --- |
| `npm ci` | Abhängigkeiten anhand des Lockfiles installieren. |
| `npm run dev` | Entwicklungsserver starten. |
| `npm run build` | TypeScript- und Vue-Typprüfung ausführen und den Produktionsbuild in `dist/` erstellen. |
| `npm run preview` | Einen zuvor erstellten Build lokal prüfen; Standardport ist `4173`. |

Der Preview-Server übernimmt in der vorhandenen Konfiguration den API-Proxy des Entwicklungsservers. Er dient der lokalen Prüfung des Builds. Für den Containerbetrieb ist Nginx vorgesehen.

## API-Konfiguration

| Einstellung | Standard | Bedeutung |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Basisadresse, die der Browser für API-Anfragen verwendet. |
| Vite-Proxyziel | `http://localhost:8000` | Backend-Adresse für Entwicklung und lokale Build-Vorschau. |
| Nginx-Proxyziel | `http://f1-backend:8000/` | Backend-Adresse im Docker-Netzwerk. |

`VITE_API_BASE_URL` wird im [API-Client](src/api/client.ts) ausgelesen. Die Endpunktpfade beginnen mit `/`; die Basisadresse ist deshalb ohne abschließenden Schrägstrich anzugeben. Bei einer direkten Backend-Adresse auf einem anderen Origin muss das Backend passende CORS-Freigaben bereitstellen.

Vite-Umgebungsvariablen werden beim Build in die statischen Dateien übernommen. Eine beim Start des fertigen Nginx-Containers gesetzte Variable ändert die API-Adresse daher nicht. Ohne abweichende Build-Konfiguration verwendet der Produktionsbuild den Standard `/api`.

## Containerbetrieb

Der [Dockerfile](Dockerfile) installiert zunächst die Abhängigkeiten und erstellt den Produktionsbuild mit `node:22-alpine`. Anschließend werden die Dateien aus `dist/` in ein `nginx:alpine`-Image übernommen.

Das Image wird im Repository-Stammverzeichnis erstellt:

```bash
docker build -t f1-frontend .
```

Die [Nginx-Konfiguration](nginx.conf) erwartet ein Backend, das im gemeinsamen Docker-Netzwerk unter dem Namen oder Netzwerkalias `f1-backend` auf Port `8000` erreichbar ist. Das folgende Beispiel setzt voraus, dass dieses Netzwerk bereits unter dem Namen `f1-network` besteht und das Backend daran angeschlossen ist. Bei einem bestehenden Deployment ist stattdessen dessen Netzwerkname zu verwenden.

```bash
docker run --rm --name f1-frontend --network f1-network -p 8081:80 f1-frontend
```

Das Frontend ist anschließend unter `http://localhost:8081` erreichbar. Nginx leitet `/api/` an das Backend weiter und entfernt dabei das Präfix. Für andere, nicht als Datei vorhandene Pfade wird `index.html` ausgeliefert, damit direkte Aufrufe wie `/results?season=2026` mit dem History-Router funktionieren.

Der Frontend-Container startet kein Backend. Eine Docker-Compose-Datei ist in diesem Repository nicht enthalten.

## Projektstruktur

```text
src/
├── api/
│   ├── client.ts          HTTP-Client und HTTP-Fehlerklasse
│   ├── endpoints/        Funktionen für Backend-Endpunkte
│   └── types.ts          TypeScript-Datenmodelle
├── components/           Fachliche Oberflächenkomponenten
├── router/               Routendefinitionen
├── views/                Start- und Ergebnisseite
├── App.vue               Einbindung der aktiven Route
├── main.ts               Initialisierung von Vue und Router
└── style.css             Globale Styles und Gestaltungsvariablen
public/                   Statische Dateien, insbesondere das Logo
Dockerfile                Container-Build
nginx.conf                Statische Auslieferung und API-Proxy
vite.config.ts            Vue-Plugin und Entwicklungsproxy
```

## Navigation und Komponentenaufbau

| Route | Ansicht | Bedeutung |
| --- | --- | --- |
| `/` | `Home.vue` | Einstieg mit Saisonauswahl. |
| `/results?season=2026` | `Results.vue` | Beispiel für eine saisonbezogene Ergebnisseite. |

Die Saison wird über den Query-Parameter `season` mit der URL abgeglichen. Beim Einstieg in die Ergebnisseite wird eine verfügbare Saison aus der URL übernommen; andernfalls wird die neueste verfügbare Saison ausgewählt. Saisonwechsel innerhalb der Ergebnisseite verwenden `router.replace` und erzeugen dadurch keinen zusätzlichen Eintrag im Browserverlauf.

Rennwochenende, Session-Ergebnisdialog und Startaufstellung werden im Komponentenzustand gehalten. Diese Auswahl ist nicht Teil der URL und wird nach einem vollständigen Neuladen nicht wiederhergestellt.

```text
Home.vue
  └─ Saison wählen → /results?season=...

Results.vue
  ├─ ResultsSidebar.vue       Saison und Wochenende wählen
  ├─ SeasonStandings.vue      Fahrer- und Teamwertung
  │    └─ DriverDetailsModal.vue
  ├─ ResultsTable.vue         Sessions und Ergebnisse
  │    └─ DriverDetailsModal.vue
  └─ StartingGrid.vue         Startaufstellung
```

`Results.vue` entscheidet anhand der Auswahl, welche Hauptansicht erscheint: Bei ausgewählter Saison ohne Rennwochenende ist es die Weltmeisterschaftswertung; mit Rennwochenende die Session-Liste; nach Öffnen einer Startaufstellung die Grid-Ansicht.

## Ansichten und Komponenten

### `Home.vue`

**Aufgabe:** Einstieg mit Saisonauswahl. Die Ansicht hat keine Props oder eigenen Events. Beim Laden ruft sie `getSeasons()` auf, sortiert die Saisons absteigend und zeigt den Ladezustand oder eine Fehlermeldung an. Nach einer Auswahl navigiert sie zu `/results?season=...`.

### `Results.vue`

**Aufgabe:** Hält die Auswahl von Saison und Rennwochenende und setzt die passenden Ansichten zusammen. Die Ansicht hat keine Props oder eigenen Events.

**Daten:** `getSeasons()` beim Einstieg; `getWeekends(season)` nach einer Saisonwahl. Die Saison wird mit dem Query-Parameter `season` abgeglichen. Wenn kein gültiger Parameter vorliegt, wählt die Ansicht die neueste verfügbare Saison. Rennwochenenden werden nach Startdatum sortiert.

**Zustandswechsel:** Ein Saisonwechsel setzt Wochenende und Startaufstellung zurück. Die Anfrage nach den Rennwochenenden der vorherigen Saison wird abgebrochen; eine Anfragekennung verhindert zusätzlich, dass eine späte Antwort den aktuellen Zustand überschreibt. Der Wechsel aktualisiert die URL.

### `ResultsSidebar.vue`

**Aufgabe:** Zeigt verfügbare Saisons, Wochenenden und die aktive Auswahl.

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `seasons` | `number[]` | Angezeigte Saisons; die übergeordnete Ansicht liefert sie sortiert. |
| `weekends` | `RaceWeekend[]` | Wochenenden der aktuellen Saison. |
| `selectedSeason` | `number \| null` | Aktive Saison. |
| `selectedWeekendId` | `number \| null` | Aktives Wochenende. |
| `loading` | `boolean` | Ladezustand der Saisonauswahl. |
| `error` | `string \| null` | Fehlermeldung beim Laden. |

| Event | Nutzlast | Wirkung in der übergeordneten Ansicht |
| --- | --- | --- |
| `select-season` | `season: number` | Saison wechseln. |
| `select-weekend` | `weekendId: number` | Wochenende öffnen. |
| `go-home` | keine | Zur Startseite wechseln. |

Die Komponente lädt selbst keine Daten. Sie zeigt die von `Results.vue` übergebenen Werte und meldet Auswahlaktionen über Events zurück.

### `SeasonStandings.vue`

**Aufgabe:** Zeigt Fahrer- und Teamwertung der Saison. Prop: `season: number`. Eigene Events: keine.

**Daten:** `getDriverStandings(season)` und `getTeamStandings(season)` werden parallel aufgerufen; die Wertungen werden nach Position sortiert. Fahrerprofile werden nach Empfang der Fahrerwertung einzeln mit `getSeasonDriver(season, driverId)` ergänzt. Positionen und Punkte können bereits sichtbar sein, während Namen und Teamzuordnung noch laden. Ohne verfügbares Profil erscheinen `Fahrer #<ID>` und `Team unbekannt`. Ein Klick auf einen Fahrer öffnet `DriverDetailsModal.vue`.

**Fehlerfälle:** Fahrer- und Teamwertung besitzen getrennte Lade- und Fehlerzustände. Leere Wertungen erhalten eigene Hinweise. Antworten mit Status `404` werden mit einer gesonderten Meldung behandelt. Beim Saisonwechsel werden vorherige Anfragen über einen gemeinsamen `AbortController` abgebrochen und die Anfragekennung erhöht.

### `ResultsTable.vue`

**Aufgabe:** Zeigt Informationen zu einem Rennwochenende, seine Sessions und ein Popup mit Session-Ergebnissen.

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `weekend` | `RaceWeekend` | Gewähltes Rennwochenende. |
| `season` | `number` | Saison für Fahrerprofile. |

| Event | Nutzlast | Wirkung in der übergeordneten Ansicht |
| --- | --- | --- |
| `show-starting-grid` | `session: Session` | `Results.vue` öffnet die Startaufstellung. |

**Daten:** `getSessions(weekend.id)` wird beim Öffnen oder Wechseln des Wochenendes aufgerufen. Ein Klick auf eine Session lädt mit `getSessionResults(session.id)` die Klassifikation in einen Ergebnisdialog. Die Daten werden in der vom Backend gelieferten Reihenfolge dargestellt. Fahrernamen werden über `getSeasonDriver()` ergänzt. Die Schaltfläche für die Startaufstellung erscheint ausschließlich für `grand_prix` und `sprint`.

**Anfragesteuerung:** Session-Liste und Ergebnisdialog besitzen getrennte `AbortController` und Anfragekennungen. Das Schließen des Ergebnisdialogs bricht dessen laufende Anfragen ab und setzt die zugehörigen Daten zurück. Der Wechsel des Wochenendes lädt die Session-Liste neu; ein bereits geöffneter Ergebnisdialog wird dadurch im aktuellen Stand nicht automatisch geschlossen.

### `StartingGrid.vue`

**Aufgabe:** Zeigt die Startpositionen des gewählten Wochenendes.

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `season` | `number` | Saison für Fahrerprofile. |
| `weekend` | `RaceWeekend` | Wochenende, dessen Grids geladen werden. |
| `sourceSession` | `Session` | Session, aus der die Grid-Ansicht geöffnet wurde. |

Event: `back` ohne Nutzlast; `Results.vue` kehrt zur Session-Ansicht zurück.

**Daten:** `getStartingGrid(weekend.id)` liefert eine Liste von Startaufstellungen. Beim Aufruf aus einem Sprint wird bevorzugt `sprint_qualifying`, beim Aufruf aus einem Grand Prix `qualifying` ausgewählt. Fehlt die bevorzugte Variante, wird die erste nicht leere Startaufstellung verwendet. Innerhalb der Ansicht kann zwischen mehreren verfügbaren Varianten gewechselt werden. Die Einträge werden nach Position sortiert. Fahrerprofile werden mit `getSeasonDriver()` ergänzt; innerhalb dieser Komponente laufen maximal fünf Profilanfragen gleichzeitig.

**Fehlerfälle:** Leere Startaufstellungen werden ausgefiltert. Fehlen Profile, bleiben Startplatz und Fahrer-ID sichtbar. Bei `404` erscheint ein gesonderter Hinweis. Überholte Anfragen werden abgebrochen beziehungsweise über die Anfragekennung ignoriert. Das Feld „Zusatzinfo“ ist derzeit ein Platzhalter; Strafen oder Positionsänderungen werden dort nicht dargestellt.

### `DriverDetailsModal.vue`

**Aufgabe:** Zeigt ein Fahrerprofil in einem Dialog.

| Prop | Typ | Bedeutung |
| --- | --- | --- |
| `open` | `boolean` | Dialog sichtbar oder geschlossen. |
| `season` | `number` | Saison des Fahrerprofils. |
| `driverId` | `number \| null` | Ausgewählter Fahrer. |

Event: `close` ohne Nutzlast. Der Dialog schließt per Schaltfläche, Escape-Taste oder Klick auf den Hintergrund.

**Daten:** Bei geöffnetem Dialog und gesetzter Fahrer-ID lädt die Komponente das Profil über `getSeasonDriver(season, driverId)`. Auch eine Änderung der Saison oder Fahrer-ID löst das Laden erneut aus. Eine Anfragekennung verwirft Antworten, die nach einer neueren Auswahl eintreffen; ein `AbortSignal` wird hier nicht verwendet. Porträts können als Data-URL oder als Base64-Inhalt vorliegen. Fehlt das Porträt oder kann es nicht angezeigt werden, wird das vom Backend gelieferte Fahrerkürzel als Ersatz dargestellt.

## API-Vertrag

Alle Funktionen in [src/api/endpoints/index.ts](src/api/endpoints/index.ts) nutzen `apiClient<T>(path, init)` aus [src/api/client.ts](src/api/client.ts). Sämtliche aufgeführten Endpunkte werden mit `GET` aufgerufen. Die Pfade in der Tabelle sind relativ zur API-Basisadresse angegeben.

Der Client erwartet JSON und wirft bei HTTP-Antworten mit `response.ok === false` einen `ApiError` mit Statuscode. Ein optionales `AbortSignal` erlaubt den aufrufenden Komponenten, überholte Anfragen abzubrechen.

| Funktion | Parameter | Rückgabe | Backend-Pfad |
| --- | --- | --- | --- |
| `getSeasons` | `signal?` | `Promise<number[]>` | `/seasons/` |
| `getWeekends` | `year, signal?` | `Promise<RaceWeekend[]>` | `/seasons/{year}/weekends/` |
| `getSessions` | `weekendId, signal?` | `Promise<Session[]>` | `/weekend/{weekendId}/sessions/` |
| `getSessionResults` | `sessionId, signal?` | `Promise<SessionResult>` | `/session/{sessionId}/result/` |
| `getDriverStandings` | `season, signal?` | `Promise<DriverStandings>` | `/standings/{season}/driver_standings/` |
| `getTeamStandings` | `season, signal?` | `Promise<TeamStandings>` | `/standings/{season}/team_standings/` |
| `getSeasonDriver` | `season, driverId, signal?` | `Promise<Driver>` | `/seasons/{season}/drivers/{driverId}/` |
| `getStartingGrid` | `weekendId, signal?` | `Promise<StartingGrid[]>` | `/weekend/{weekendId}/starting_grid/` |

Die Funktionen liefern die Antwortdaten unverändert zurück. Sortierung und Auswahl erfolgen in den Ansichten oder Komponenten. Netzwerkfehler, abgebrochene Anfragen oder ungültiges JSON können weitere Fehler auslösen; die aufrufende Komponente legt die sichtbare Meldung fest. Die TypeScript-Typen prüfen die Antwortstruktur nicht zur Laufzeit.

## Datenmodelle

Die Interfaces in [src/api/types.ts](src/api/types.ts) beschreiben die vom Frontend erwartete Form der Backend-Antworten:

- `RaceWeekend` enthält Kennung, Name, Land und Zeitraum eines Rennwochenendes. `country` kann `null` sein.
- `Session` verbindet Session-Typ und Startzeit mit einer `weekend_id`.
- `SessionResult` enthält eine Liste von `SessionClassification` mit Position, Fahrer-ID, Status, Zeit, Rundenzahl und Zeitabständen. Die Zeitdarstellung im Frontend interpretiert numerische Zeitwerte als Sekunden; fehlende Werte werden als `-` dargestellt.
- `DriverStandings` und `TeamStandings` enthalten die Platzierungen und Punkte einer Saison. `DriverStanding` enthält im aktuellen Frontend-Datenmodell nur Position, Fahrer-ID und Punkte; der Name wird über das Fahrerprofil ergänzt.
- `Driver` enthält Name, Kürzel, Team und das Feld `portrait_base64`. Dieses Feld ist als Zeichenkette definiert; eine leere oder nicht darstellbare Bildangabe wird in der Oberfläche abgefangen.
- `StartingGrid` enthält Session-Typ, Session-ID, Wochenend-ID und eine Liste von `StartingPosition`-Einträgen mit Position und Fahrer-ID.

Datums- und Uhrzeitangaben werden mit `de-DE` formatiert. Da die Formatierung keine feste Zeitzone vorgibt, verwendet sie die lokale Zeitzone des Browsers. Das Feld `gmt_offset` wird dabei nicht gesondert angewendet.

## Datenverfügbarkeit und aktuelle Grenzen

- Der API-Client implementiert weder einen zentralen Anwendungscache noch eine Zusammenführung identischer Anfragen, automatische Wiederholungen oder eine globale Ratenbegrenzung.
- Fahrerwertung und Session-Ergebnisse laden Fahrerprofile einzeln und ohne eigene Parallelitätsgrenze nach. Wiederholte Navigation und das Öffnen von Fahrerprofilen können zusätzliche Anfragen auslösen. Die Begrenzung auf fünf parallele Profilanfragen gilt nur für die Startaufstellung.
- Eine fehlgeschlagene Profilanfrage verhindert nicht die Anzeige bereits geladener Positionen und Punkte. In diesem Fall bleibt die Fahrer-ID als Ersatzbezeichnung sichtbar.
- Lade-, Fehler- und Leerzustände werden in den jeweiligen Komponenten behandelt. Der HTTP-Status `404` allein unterscheidet nicht zwischen einem fehlenden Endpunkt und einer nicht vorhandenen Ressource; für die Ursachenprüfung ist die konkrete Backend-Antwort maßgeblich.
- Die Schriftart „Titillium Web“ wird über Google Fonts eingebunden. Ohne Zugriff auf diesen Dienst verwendet die Oberfläche die konfigurierte Systemschrift als Ersatz.

## Prüfung und Fehleranalyse

`npm run build` führt die vorhandene Typprüfung und den Produktionsbuild aus. Im Repository sind derzeit keine automatisierten Unit-, Komponenten- oder End-to-End-Tests und kein separater Lint-Befehl eingerichtet. Ein erfolgreicher Build belegt daher nicht die Funktionsfähigkeit der Backend-Anbindung.

Für eine manuelle Funktionsprüfung mit laufendem Backend sind insbesondere folgende Abläufe relevant:

1. Saison auf der Startseite auswählen und die URL sowie die Fahrer- und Teamwertung prüfen.
2. Wiederholt zwischen Saisons und Rennwochenenden wechseln und die Zuordnung der angezeigten Daten kontrollieren.
3. Session-Ergebnisse und Fahrerprofile öffnen und schließen; dabei auch fehlende Ergebnisse oder Porträts berücksichtigen.
4. Startaufstellungen aus Grand Prix und Sprint öffnen und die gewählte Qualifying-Variante prüfen.
5. Die Ergebnisseite direkt aufrufen und neu laden; einen ungültigen Saisonparameter sowie schmale Browserfenster prüfen.

| Beobachtung | Prüfansatz |
| --- | --- |
| Saisons oder Rennwochenenden werden nicht geladen. | API-Adresse, Proxyziel und Erreichbarkeit des Backends prüfen; Status und Antwort im Netzwerkbereich der Browser-Entwicklerwerkzeuge auswerten. |
| Statt eines Fahrernamens erscheint `Fahrer #<ID>`. | Die zugehörige Anfrage an `/seasons/{season}/drivers/{driverId}/` prüfen. Wertung und Profil werden getrennt geladen. |
| `429` bei API-Anfragen. | Anzahl und Ursprung der Anfragen sowie die Ratenbegrenzung des Backends beziehungsweise seiner Datenquelle prüfen. |
| `404` bei Wertungen oder Startaufstellungen. | Aufgerufenen Pfad und Ressourcen-ID mit der eingesetzten Backend-Version abgleichen. |
| Nginx meldet einen nicht auflösbaren Backend-Host oder liefert `502`. | Gemeinsames Docker-Netzwerk, Backend-Alias `f1-backend`, Backend-Port `8000` und Backend-Prozess prüfen. |
| Direkter Aufruf von `/results` schlägt auf einem anderen Webserver fehl. | Einen Rückfall auf `index.html` für clientseitige Routen konfigurieren. |

## Lizenz

Das Repository enthält die GNU General Public License, Version 3. Der vollständige Lizenztext befindet sich in [LICENSE](LICENSE).
