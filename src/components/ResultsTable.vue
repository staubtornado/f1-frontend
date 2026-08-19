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
import { getSessions } from '../api/endpoints'
import type { Session, RaceWeekend } from '../api/types'

interface Props {
  weekend: RaceWeekend
}

const props = defineProps<Props>()

const sessions = ref<Session[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

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
    grand_prix: 'Grand Prix'
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
    console.log(`Loaded ${sessions.value.length} sessions for weekend ${props.weekend.id}`)
    console.log(`Flag: ${props.weekend.country?.flag_base64}`)
  } catch (err) {
    error.value = 'Sessions konnten nicht geladen werden.'
    console.error(err)
  } finally {
    loading.value = false
  }
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
            <th>Datum</th>
            <th>Uhrzeit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.id">
            <td class="results-table__session-type">
              {{ getSessionTypeName(session.type) }}
            </td>
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
