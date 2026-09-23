/**
 * Results View
 * 
 * Hauptseite der Anwendung mit zwei Bereichen:
 * 
 * 1. SIDEBAR (links):
 *    - Liste aller verfügbaren Saisons
 *    - Wochenenden der aktuell ausgewählten Saison
 *    - Ermöglicht Navigation zwischen Saisons und Wochenenden
 *    - Home-Button zur Rückkehr zur Startseite
 * 
 * 2. MAIN CONTENT (rechts):
 *    - Zeigt allgemeine Informationen zum ausgewählten Wochenende
 *      (Flagge, Land, Circuit, Daten, etc.)
 *    - Tabelle mit allen Sessions des Wochenendes
 * 
 * Die Seite synchronisiert sich mit der URL (Query Parameter: ?season=YYYY)
 */

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getApiErrorMessage } from '../api/client'
import { getSeasons, getWeekends } from '../api/endpoints'
import type { RaceWeekend, Session } from '../api/types'
import ResultsSidebar from '../components/ResultsSidebar.vue'
import ResultsTable from '../components/ResultsTable.vue'
import SeasonStandings from '../components/SeasonStandings.vue'
import StartingGrid from '../components/StartingGrid.vue'

const router = useRouter()
const route = useRoute()

const seasons = ref<number[]>([])
const selectedSeason = ref<number | null>(null)
const weekends = ref<RaceWeekend[]>([])
const selectedWeekendId = ref<number | null>(null)
const startingGridSession = ref<Session | null>(null)
const weekendsStatus = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle')
const seasonsLoading = ref(true)
const seasonsError = ref<string | null>(null)
const weekendsError = ref<string | null>(null)
let seasonsController: AbortController | null = null
let weekendsController: AbortController | null = null

// Sortiert Saisons in absteigender Reihenfolge (neueste zuerst)
const sortedSeasons = computed(() => [...seasons.value].sort((a, b) => b - a))

// Sortiert Wochenenden chronologisch (älteste zuerst)
const sortedWeekends = computed(() => [...weekends.value].sort((a, b) => {
  return new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
}))

// Findet das aktuell ausgewählte Wochenende-Objekt
const selectedWeekend = computed(() => 
  weekends.value.find(w => w.id === selectedWeekendId.value)
)

const loadSeasons = async (): Promise<number[] | null> => {
  seasonsController?.abort()
  seasonsController = new AbortController()
  const { signal } = seasonsController
  seasonsLoading.value = true
  seasonsError.value = null

  try {
    const loadedSeasons = await getSeasons(signal)
    if (signal.aborted) return null
    seasons.value = loadedSeasons
    return loadedSeasons
  } catch (caughtError) {
    if (!signal.aborted) {
      seasonsError.value = getApiErrorMessage(caughtError, 'Saisons konnten nicht geladen werden.')
      console.error(caughtError)
    }
  } finally {
    if (!signal.aborted) seasonsLoading.value = false
  }

  return null
}

const selectInitialSeason = (availableSeasons: number[]) => {
  const seasonQuery = Array.isArray(route.query.season)
    ? route.query.season[0]
    : route.query.season
  const seasonParam = seasonQuery ? Number(seasonQuery) : null

  if (seasonParam && availableSeasons.includes(seasonParam)) {
    selectedSeason.value = seasonParam
  } else if (availableSeasons.length > 0) {
    const latestCurrentSeason = [...availableSeasons]
      .sort((first, second) => second - first)
      .find((season) => season <= new Date().getFullYear())
    selectedSeason.value = latestCurrentSeason ?? Math.max(...availableSeasons)
  }
}

/** Load seasons first so a direct /results visit can choose a valid default. */
onMounted(async () => {
  const availableSeasons = await loadSeasons()
  if (availableSeasons) selectInitialSeason(availableSeasons)
})

/**
 * Überwacht die ausgewählte Saison
 * Wenn sich die Saison ändert:
 * 1. Lädt die Wochenenden dieser Saison
 * 2. Setzt die Wochenends-Auswahl zurück (null)
 * 3. Aktualisiert die URL
 */
const loadWeekends = async (newSeason: number) => {
  weekendsController?.abort()
  const controller = new AbortController()
  weekendsController = controller
  selectedWeekendId.value = null
  startingGridSession.value = null
  weekends.value = []
  weekendsStatus.value = 'loading'
  weekendsError.value = null

  void router.replace({ name: 'Results', query: { season: String(newSeason) } })

  try {
    const loadedWeekends = await getWeekends(newSeason, controller.signal)

    if (controller.signal.aborted) return

    weekends.value = loadedWeekends
    weekendsStatus.value = 'loaded'
  } catch (caughtError) {
    if (controller.signal.aborted) return

    weekendsStatus.value = 'error'
    weekendsError.value = getApiErrorMessage(caughtError, 'Rennwochenenden konnten nicht geladen werden.')
    console.error(caughtError)
  }
}

watch(selectedSeason, (newSeason) => {
  if (newSeason !== null) void loadWeekends(newSeason)
})

onBeforeUnmount(() => {
  seasonsController?.abort()
  weekendsController?.abort()
})

watch(
  () => route.query.season,
  (seasonQuery) => {
    const rawSeason = Array.isArray(seasonQuery) ? seasonQuery[0] : seasonQuery
    const season = rawSeason ? Number(rawSeason) : null

    if (season !== null && seasons.value.includes(season) && season !== selectedSeason.value) {
      selectedSeason.value = season
    }
  },
)

const retrySeasons = async () => {
  const availableSeasons = await loadSeasons()
  if (availableSeasons && selectedSeason.value === null) selectInitialSeason(availableSeasons)
}

const retryWeekends = () => {
  if (selectedSeason.value !== null) void loadWeekends(selectedSeason.value)
}

const selectSeason = (season: number) => {
  selectedSeason.value = season
}

const selectWeekend = (weekendId: number) => {
  startingGridSession.value = null
  selectedWeekendId.value = weekendId
}

/**
 * Navigiert zurück zur Startseite (Home)
 */
const goHome = () => {
  router.push({ name: 'Home' })
}
</script>

<template>
  <div class="results-page">
    <ResultsSidebar
      :seasons="sortedSeasons"
      :weekends="sortedWeekends"
      :selected-season="selectedSeason"
      :selected-weekend-id="selectedWeekendId"
      :seasons-loading="seasonsLoading"
      :seasons-error="seasonsError"
      :weekends-loading="weekendsStatus === 'loading'"
      :weekends-error="weekendsError"
      @select-season="selectSeason"
      @select-weekend="selectWeekend"
      @go-home="goHome"
      @retry-seasons="retrySeasons"
      @retry-weekends="retryWeekends"
    />

    <main class="results-page__main">
      <StartingGrid
        v-if="selectedWeekendId && selectedWeekend && startingGridSession"
        :key="`${selectedSeason}-${selectedWeekend.id}-${startingGridSession.id}`"
        :weekend="selectedWeekend"
        :season="selectedSeason!"
        :source-session="startingGridSession"
        @back="startingGridSession = null"
      />
      <ResultsTable
        v-else-if="selectedWeekendId && selectedWeekend"
        :weekend="selectedWeekend"
        :season="selectedSeason!"
        @show-starting-grid="startingGridSession = $event"
      />
      <SeasonStandings
        v-else-if="selectedSeason !== null"
        :season="selectedSeason"
        :weekends-status="weekendsStatus"
      />
      <div v-else class="results-page__empty" role="status">
        <p v-if="seasonsLoading">Saisons werden geladen…</p>
        <p v-else-if="seasonsError">Saisons konnten nicht geladen werden. Bitte versuchen Sie es erneut.</p>
        <p v-else-if="seasons.length === 0">Es sind keine Saisons verfügbar.</p>
        <p v-else>Wählen Sie ein Rennwochenende aus der Seitenleiste.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.results-page {
  display: flex;
  min-height: 100svh;
  background: var(--bg);
}

.results-page__main {
  flex: 1;
  min-width: 0;
  padding: 32px;
  overflow-y: auto;
}

.results-page__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .results-page {
    flex-direction: column;
  }

  .results-page__main {
    width: 100%;
    padding: 24px 16px;
  }
}
</style>
