<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ApiError, getApiErrorMessage } from '../api/client'
import { getSeasonDriver, getStartingGrid } from '../api/endpoints'
import type { Driver, RaceWeekend, Session, SessionType, StartingGrid as StartingGridData } from '../api/types'

interface Props {
  season: number
  weekend: RaceWeekend
  sourceSession: Session
}

const props = defineProps<Props>()
defineEmits<{ back: [] }>()

const grids = ref<StartingGridData[]>([])
const driverProfiles = ref<Record<number, Driver>>({})
const selectedSessionId = ref<number | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
let requestId = 0
let controller: AbortController | null = null

const gridTypeName = (type: SessionType): string =>
  type === 'sprint_qualifying' ? 'Sprint-Qualifying' : 'Qualifying'

const preferredGridType = computed<SessionType>(() =>
  props.sourceSession.type === 'sprint' ? 'sprint_qualifying' : 'qualifying',
)

const selectedGrid = computed(() =>
  grids.value.find((grid) => grid.session_id === selectedSessionId.value)
    ?? grids.value.find((grid) => grid.session_type === preferredGridType.value)
    ?? grids.value[0]
    ?? null,
)

const sortedPositions = computed(() =>
  selectedGrid.value?.positions.slice().sort((first, second) => first.position - second.position) ?? [],
)

const getDriverName = (driverId: number): string =>
  driverProfiles.value[driverId]?.full_name ?? `Fahrer #${driverId}`

const getTeamName = (driverId: number): string =>
  driverProfiles.value[driverId]?.team_name ?? 'Team unbekannt'

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

const loadDriverProfiles = async (activeController: AbortController, activeRequestId: number) => {
  const driverIds = [...new Set(grids.value.flatMap((grid) => grid.positions.map((position) => position.driver_id)))]
  let nextIndex = 0

  const loadNextProfile = async () => {
    while (!activeController.signal.aborted && nextIndex < driverIds.length) {
      const driverId = driverIds[nextIndex++]
      try {
        const driver = await getSeasonDriver(props.season, driverId, activeController.signal)
        if (activeRequestId !== requestId || activeController.signal.aborted) return
        driverProfiles.value = { ...driverProfiles.value, [driverId]: driver }
      } catch {
        // Die Startposition bleibt mit Fahrer-ID sichtbar, falls kein Profil vorliegt.
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(5, driverIds.length) }, loadNextProfile))
}

const loadStartingGrid = async () => {
  controller?.abort()
  const activeController = new AbortController()
  controller = activeController
  const activeRequestId = ++requestId

  loading.value = true
  error.value = null
  grids.value = []
  driverProfiles.value = {}
  selectedSessionId.value = null

  try {
    const response = await getStartingGrid(props.weekend.id, activeController.signal)
    if (activeRequestId !== requestId || activeController.signal.aborted) return

    grids.value = Array.isArray(response)
      ? response
          .filter((grid) => Array.isArray(grid.positions) && grid.positions.length > 0)
          .map((grid) => ({
            ...grid,
            positions: grid.positions.slice().sort((first, second) => first.position - second.position),
          }))
      : []

    const preferredGrid = grids.value.find((grid) => grid.session_type === preferredGridType.value)
      ?? grids.value[0]
    selectedSessionId.value = preferredGrid?.session_id ?? null
    loading.value = false

    void loadDriverProfiles(activeController, activeRequestId)
  } catch (caughtError) {
    if (activeRequestId !== requestId || activeController.signal.aborted) return
    error.value = caughtError instanceof ApiError && caughtError.status === 404
      ? 'Der Starting-Grid-Endpunkt wurde im Backend nicht gefunden.'
      : getApiErrorMessage(caughtError, 'Starting Grid konnte nicht geladen werden.')
    console.error(caughtError)
  } finally {
    if (activeRequestId === requestId) loading.value = false
  }
}

onMounted(loadStartingGrid)
onBeforeUnmount(() => {
  requestId++
  controller?.abort()
})
</script>

<template>
  <section class="starting-grid" aria-labelledby="starting-grid-title">
    <button class="starting-grid__back" type="button" @click="$emit('back')">
      <span aria-hidden="true">←</span>
      Zurück zu Sessions
    </button>

    <header class="starting-grid__event">
      <p class="starting-grid__season">Saison {{ season }}</p>
      <h1 class="starting-grid__event-name">{{ weekend.name }}</h1>
      <p class="starting-grid__event-details">
        <span v-if="weekend.country">{{ weekend.country.name_de }}</span>
        <span>{{ formatDate(weekend.date_start) }} – {{ formatDate(weekend.date_end) }}</span>
        <span>Circuit {{ weekend.circuit_id }}</span>
      </p>
    </header>

    <div class="starting-grid__heading">
      <div>
        <p class="starting-grid__eyebrow">Startaufstellung</p>
        <h2 id="starting-grid-title">Starting Grid</h2>
      </div>
      <nav v-if="grids.length > 1" class="starting-grid__switcher" aria-label="Starting Grid auswählen">
        <button
          v-for="grid in grids"
          :key="grid.session_id"
          type="button"
          :aria-pressed="selectedGrid?.session_id === grid.session_id"
          :class="{ 'starting-grid__switch--active': selectedGrid?.session_id === grid.session_id }"
          @click="selectedSessionId = grid.session_id"
        >
          {{ gridTypeName(grid.session_type) }}
        </button>
      </nav>
      <span v-else-if="selectedGrid" class="starting-grid__session-tag">
        {{ gridTypeName(selectedGrid.session_type) }}
      </span>
    </div>

    <p v-if="loading" class="starting-grid__status" role="status">Starting Grid wird geladen…</p>
    <p v-else-if="error" class="starting-grid__status starting-grid__status--error" role="alert">
      {{ error }}
    </p>
    <p v-else-if="!selectedGrid || sortedPositions.length === 0" class="starting-grid__status">
      Für dieses Rennwochenende ist kein Starting Grid verfügbar.
    </p>
    <ol v-else class="starting-grid__positions" aria-label="Startpositionen">
      <li v-for="entry in sortedPositions" :key="`${selectedGrid.session_id}-${entry.position}`">
        <article class="starting-grid__position-card">
          <span class="starting-grid__position-number">P{{ entry.position }}</span>
          <div class="starting-grid__driver">
            <h3>{{ getDriverName(entry.driver_id) }}</h3>
            <p>{{ getTeamName(entry.driver_id) }}</p>
          </div>
          <div class="starting-grid__extra" aria-label="Platz für Grid-Strafen oder Positionsänderungen">
            <span>Zusatzinfo</span>
            <span>—</span>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.starting-grid {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.starting-grid__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 28px;
  padding: 8px 11px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
}

.starting-grid__back:hover,
.starting-grid__back:focus-visible {
  border-color: var(--f1-red);
  background: rgb(225 6 0 / 8%);
  color: var(--text);
}

.starting-grid__back span {
  font-size: 1.15rem;
  line-height: 1;
}

.starting-grid__event {
  margin-bottom: 38px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.starting-grid__season,
.starting-grid__eyebrow {
  margin: 0 0 7px;
  color: var(--f1-red);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.starting-grid__event-name {
  margin: 0;
  font-size: clamp(1.65rem, 4vw, 2.35rem);
  letter-spacing: -0.03em;
}

.starting-grid__event-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.starting-grid__heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.starting-grid__eyebrow {
  margin-bottom: 4px;
}

.starting-grid__heading h2 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  letter-spacing: -0.035em;
}

.starting-grid__session-tag,
.starting-grid__switcher button {
  padding: 7px 11px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgb(255 255 255 / 4%);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.starting-grid__switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.starting-grid__switcher button {
  font: inherit;
  cursor: pointer;
  transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
}

.starting-grid__switcher button:hover,
.starting-grid__switcher button:focus-visible,
.starting-grid__switcher .starting-grid__switch--active {
  border-color: var(--f1-red);
  background: rgb(225 6 0 / 13%);
  color: var(--text);
}

.starting-grid__positions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 28px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.starting-grid__position-card {
  position: relative;
  display: grid;
  min-height: 142px;
  grid-template-columns: 64px minmax(0, 1fr);
  align-content: center;
  column-gap: 16px;
  padding: 22px 24px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: linear-gradient(140deg, var(--bg-elevated), rgb(22 22 29 / 95%));
  transition: border-color 160ms ease, transform 160ms ease;
}

.starting-grid__position-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 3px;
  background: var(--f1-red);
  content: '';
}

.starting-grid__position-card:hover {
  transform: translateY(-2px);
  border-color: rgb(225 6 0 / 55%);
}

.starting-grid__position-number {
  grid-row: span 2;
  align-self: center;
  color: var(--f1-red);
  font-size: 1.45rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
}

.starting-grid__driver {
  min-width: 0;
}

.starting-grid__driver h3 {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: clamp(1rem, 2vw, 1.18rem);
  font-weight: 700;
}

.starting-grid__driver p {
  margin: 5px 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.starting-grid__extra {
  display: flex;
  grid-column: 2;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  padding-top: 9px;
  border-top: 1px dashed rgb(255 255 255 / 10%);
  color: var(--text-muted);
  font-size: 0.7rem;
}

.starting-grid__status {
  margin: 0;
  padding: 48px 24px;
  color: var(--text-muted);
  text-align: center;
}

.starting-grid__status--error {
  color: #ff6b6b;
}

@media (max-width: 700px) {
  .starting-grid__positions {
    grid-template-columns: 1fr;
  }

  .starting-grid__event {
    margin-bottom: 28px;
  }
}

@media (max-width: 480px) {
  .starting-grid__heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .starting-grid__back {
    margin-bottom: 22px;
  }

  .starting-grid__position-card {
    min-height: 128px;
    padding: 18px;
  }
}
</style>
