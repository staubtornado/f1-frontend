/**
 * ResultsTable Component
 * 
 * Zeigt allgemeine Informationen zum ausgewählten Rennwochenende an:
 * - Flagge und Name des Landes
 * - Name des Grand-Prix
 * - Wichtige Daten (Circuit, Start- und Enddatum)
 * 
 * Dann wird eine Tabelle mit allen Sessions des Wochenendes angezeigt.
 */

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getSessionResults, getSessions } from '../api/endpoints'
import type { Session, RaceWeekend } from '../api/types'

interface Props {
  weekend: RaceWeekend
}

const props = defineProps<Props>()

const sessions = ref<Session[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const popupVisible = ref(false)
const popupLoading = ref(false)
const popupError = ref<string | null>(null)
const popupSession = ref<Session | null>(null)
const sessionResults = ref<any[]>([])

/**
 * Konvertiert den Session-Typ in einen lesbaren deutschen Namen
 * @param type - Der Session-Typ (z.B. 'practice_one', 'qualifying')
 * @returns Deutscher Name der Session
 */
const getSessionTypeName = (type: string): string => {
  const names: Record<string, string> = {
    practice_one: 'Freies Training 1',
    practice_two: 'Freies Training 2',
    practice_three: 'Freies Training 3',
    sprint: 'Sprint',
    sprint_qualifying: 'Sprint-Qualifying',
    qualifying: 'Qualifying',
    grand_prix: 'Grand Prix',
  }
  return names[type] || type
}

/**
 * Formatiert einen DateTime-String in die deutsche Zeitformat (HH:MM)
 * @param timeStr - ISO DateTime String
 * @returns Formatierte Zeit (z.B. '14:30')
 */
const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

const formatDuration = (seconds: number | null): string => {
  if (seconds == null) return '-'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds.toFixed(3).padStart(6, '0')}`
}

/**
 * Formatiert einen DateTime-String in das deutsche Datumsformat (DD.MM.YYYY)
 * @param timeStr - ISO DateTime String
 * @returns Formatiertes Datum (z.B. '20.10.2024')
 */
const formatDate = (timeStr: string): string => {
  const date = new Date(timeStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Lädt Sessions vom Backend, wenn die Komponente geladen oder das Wochenende gewechselt wird
 */
const loadSessions = async () => {
  loading.value = true
  error.value = null
  try {
    sessions.value = await getSessions(props.weekend.id)
  } catch (err) {
    error.value = 'Sessions konnten nicht geladen werden.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openSessionPopup = async (session: Session) => {
  popupVisible.value = true
  popupLoading.value = true
  popupError.value = null
  popupSession.value = session
  sessionResults.value = []

  try {
    const result: any = await getSessionResults(session.id)
    console.log('Session Results:', result)
    sessionResults.value = Array.isArray(result) 
        ? result 
        : result.classifications ?? []
  } catch (err) {
    popupError.value = 'Ergebnisse konnten nicht geladen werden.'
    console.error(err)
  } finally {
    popupLoading.value = false
  }
}

const closeSessionPopup = () => {
  popupVisible.value = false
  popupError.value = null
  popupSession.value = null
  sessionResults.value = []
}

// Lädt Sessions beim initialen Mount
onMounted(loadSessions)

// Lädt Sessions neu, wenn sich das Wochenende ändert
watch(() => props.weekend.id, loadSessions)
</script>

<template>
  <div class="results-wrapper">
    <!-- Weekend Info Section -->
    <section class="weekend-info">
      <div class="weekend-info__container">
        <div class="weekend-info__header">
            <div
                class="weekend-info__flag-wrapper"
                v-if="weekend.country?.flag_base64"
                >
                <div 
                    :style="{
                    backgroundImage: `url('data:image/png;base64,${weekend.country.flag_base64}')`
                    }"
                    class="weekend-info__flag"
                    :title="weekend.country.name_de"
                />
            </div>
          <div class="weekend-info__text">
            <h1 class="weekend-info__name">{{ weekend.name }}</h1>
            <p class="weekend-info__country" v-if="weekend.country">
              {{ weekend.country.name_de }}
            </p>
          </div>
        </div>

        <div class="weekend-info__details">
          <div class="weekend-info__detail">
            <span class="weekend-info__detail-label">Circuit</span>
            <span class="weekend-info__detail-value">{{ weekend.circuit_id }}</span>
          </div>
          <div class="weekend-info__detail">
            <span class="weekend-info__detail-label">Start</span>
            <span class="weekend-info__detail-value">
              {{ new Date(weekend.date_start).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
            </span>
          </div>
          <div class="weekend-info__detail">
            <span class="weekend-info__detail-label">Ende</span>
            <span class="weekend-info__detail-value">
              {{ new Date(weekend.date_end).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}
            </span>
          </div>
          <div class="weekend-info__detail" v-if="weekend.cancelled">
            <span class="weekend-info__detail-label">Status</span>
            <span class="weekend-info__detail-value weekend-info__detail-value--cancelled">Abgesagt</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Sessions Table Section -->
    <section class="results-table-wrapper">
      <h2 class="results-table-wrapper__title">Sessions</h2>
      
      <p v-if="loading" class="results-table-wrapper__status">Laden…</p>
      <p v-else-if="error" class="results-table-wrapper__error">{{ error }}</p>

      <table v-else-if="sessions.length > 0" class="results-table">
        <thead>
          <tr>
            <th>Session</th>
            <th>ID</th>
            <th>Datum</th>
            <th>Uhrzeit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.id" @click="openSessionPopup(session)">
            <td class="results-table__session-type">
              {{ getSessionTypeName(session.type) }}
            </td>
            <td class="results-table__session-id">{{ session.id }}</td>
            <td class="results-table__date">
              {{ formatDate(session.start_time) }}
            </td>
            <td class="results-table__time">
              {{ formatTime(session.start_time) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="results-table-wrapper__empty">
        <p>Keine Sessions verfügbar</p>
      </div>
    </section>

    <!-- Session Results Popup -->
    <div v-if="popupVisible" class="session-results-popup">
        <div class="session-results-popup__container">
            <div class="session-results-popup__header">
            <h3 class="session-results-popup__title">
                Ergebnisse für {{ popupSession ? getSessionTypeName(popupSession.type) : 'Session' }}
                <span v-if="popupLoading" class="session-results-popup__loading-indicator">Laden…</span>
            </h3>
            <button class="session-results-popup__close" @click="closeSessionPopup">✖</button>
            </div>

            <div v-if="popupError" class="session-results-popup__error">
            {{ popupError }}
            </div>

            <div v-else-if="!popupLoading && sessionResults.length === 0" class="session-results-popup__empty">
            <p>Keine Ergebnisse verfügbar</p>
            </div>
            <div class="session-results-popup__drivers">

            <div class="session-results-popup__driver-header">
                <div>Pos.</div>
                <div>Fahrer</div>
                <div>Status</div>
                <div>Zeit</div>
                <div>Runden</div>
                <div>Abstand</div>
            </div>

            <div
                v-for="driver in sessionResults"
                :key="driver.driver_id"
                class="session-results-popup__driver-row"
            >
                <div class="driver-position">
                {{ driver.position }}
                </div>

                <div class="driver-id">
                #{{ driver.driver_id }}
                </div>

                <div>
                <span class="driver-status">
                    {{ driver.status }}
                </span>
                </div>

                <div class="driver-time">
                {{ formatDuration(driver.time) }}
                </div>

                <div class="driver-laps">
                {{ driver.laps_completed }}
                </div>

                <div class="driver-gap">
                {{
                    driver.gap_to_leader === 0
                    ? 'Leader'
                    : driver.gap_to_leader != null
                        ? `+${driver.gap_to_leader.toFixed(3)}s`
                        : '-'
                }}
                </div>
            </div>

            </div>
            
        </div>
    </div>
  </div>
</template>

<style scoped>
.results-wrapper {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* Weekend Info Styles */
.weekend-info {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(225, 6, 0, 0.05) 0%, rgba(0, 0, 0, 0.3) 100%);
}

.weekend-info__container {
  padding: 32px;
}

.weekend-info__header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
}

.weekend-info__flag-wrapper {
  flex-shrink: 0;
}

.weekend-info__flag {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  border: 1px solid var(--border);
  object-fit: cover;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.weekend-info__text {
  flex: 1;
}

.weekend-info__name {
  margin: 0 0 8px;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
}

.weekend-info__country {
  margin: 0;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
}

.weekend-info__details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.weekend-info__detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(225, 6, 0, 0.2);
}

.weekend-info__detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.6);
}

.weekend-info__detail-value {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text);
}

.weekend-info__detail-value--cancelled {
  color: #ff6b6b;
}

/* Results Table Styles */
.results-table-wrapper {
  width: 100%;
}

.results-table-wrapper__title {
  margin: 0 0 16px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.results-table-wrapper__status,
.results-table-wrapper__error,
.results-table-wrapper__empty {
  text-align: center;
  padding: 32px;
  color: rgba(255, 255, 255, 0.6);
}

.results-table-wrapper__error {
  color: #ff6b6b;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.results-table thead {
  background-color: rgba(225, 6, 0, 0.1);
  border-bottom: 2px solid var(--border);
}

.results-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.8);
}

.results-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.results-table tbody tr:last-child td {
  border-bottom: none;
}

.results-table tbody tr:hover {
  background-color: rgba(225, 6, 0, 0.05);
}

.results-table__session-type {
  font-weight: 500;
  color: var(--text);
}

.results-table__date,
.results-table__time {
  color: rgba(255, 255, 255, 0.8);
}

/* Session Results Popup Styles */

.session-results-popup {
  position: fixed;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(6px);

  z-index: 1000;
}


/* Popup Fenster */

.session-results-popup__container {
  width: min(1100px, 95vw);
  max-height: 85vh;

  display: flex;
  flex-direction: column;

  background: #121212;

  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;

  overflow: hidden;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6);
}


/* Header */

.session-results-popup__header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 20px 24px;

  border-bottom: 1px solid var(--border);
  background: #181818;
}

.session-results-popup__title {
  margin: 0;

  font-size: 1.2rem;
  font-weight: 600;

  color: var(--text);
}

.session-results-popup__close {
  width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.06);

  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;

  color: rgba(255, 255, 255, 0.7);

  font-size: 1rem;

  cursor: pointer;

  transition: 0.2s;
}

.session-results-popup__close:hover {
  color: white;

  border-color: rgba(225, 6, 0, 0.8);
  background: rgba(225, 6, 0, 0.15);
}


/* Loading */

.session-results-popup__loading-indicator {
  margin-left: 10px;

  font-size: 0.8rem;
  font-weight: 400;

  color: rgba(255, 255, 255, 0.5);
}


/* Error / Empty */

.session-results-popup__error,
.session-results-popup__empty {
  padding: 40px;

  text-align: center;

  color: rgba(255, 255, 255, 0.6);
}

.session-results-popup__error {
  color: #ff6b6b;
}


/* Scrollbarer Tabellenbereich */

.session-results-popup__content {
  flex: 1;

  overflow: auto;
}

.session-results-popup__drivers {
  min-width: 800px;
  overflow: scroll;
}


/* Tabellen Header */

.session-results-popup__driver-header {
  position: sticky;
  top: 0;

  z-index: 2;

  display: grid;

  grid-template-columns:
    70px
    100px
    140px
    minmax(140px, 1fr)
    100px
    140px;

  align-items: center;

  padding: 12px 20px;

  background: #1c1c1c;

  border-bottom: 1px solid rgba(255, 255, 255, 0.12);

  font-size: 0.72rem;
  font-weight: 600;

  text-transform: uppercase;
  letter-spacing: 0.08em;

  color: rgba(255, 255, 255, 0.5);
}


/* Fahrer Zeilen */

.session-results-popup__driver-row {
  display: grid;

  grid-template-columns:
    70px
    100px
    140px
    minmax(140px, 1fr)
    100px
    140px;

  align-items: center;

  padding: 14px 20px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.07);

  color: var(--text);

  transition: background 0.15s ease;
}

.session-results-popup__driver-row:hover {
  background: rgba(255, 255, 255, 0.045);
}

.session-results-popup__driver-row:last-child {
  border-bottom: none;
}


/* Position */

.driver-position {
  width: 34px;
  height: 34px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 6px;

  background: rgba(255, 255, 255, 0.07);

  font-size: 1rem;
  font-weight: 700;
}


/* Driver ID */

.driver-id {
  font-weight: 600;

  color: rgba(255, 255, 255, 0.85);
}


/* Status */

.driver-status {
  display: inline-block;

  padding: 4px 8px;

  border-radius: 5px;

  background: rgba(255, 255, 255, 0.07);

  font-size: 0.75rem;

  color: rgba(255, 255, 255, 0.7);
}


/* Zeiten */

.driver-time,
.driver-gap {
  font-family: monospace;

  font-size: 0.9rem;
}

.driver-laps {
  font-weight: 500;
}


/* Mobile */

@media (max-width: 768px) {

  .session-results-popup {
    padding: 12px;
  }

  .session-results-popup__container {
    width: 100%;
    max-height: 90vh;
  }

  .session-results-popup__header {
    padding: 16px;
  }

  .session-results-popup__title {
    font-size: 1rem;
  }

  .session-results-popup__content {
    overflow-x: auto;
  }

}

@media (max-width: 768px) {
  .results-wrapper {
    gap: 32px;
  }

  .weekend-info__container {
    padding: 16px;
  }

  .weekend-info__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }

  .weekend-info__flag {
    width: 100px;
    height: 67px;
  }

  .weekend-info__name {
    font-size: 1.5rem;
  }

  .weekend-info__details {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .results-table {
    font-size: 0.875rem;
  }

  .results-table th,
  .results-table td {
    padding: 12px 8px;
  }
}
</style>
