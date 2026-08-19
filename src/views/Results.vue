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
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSeasons, getWeekends } from '../api/endpoints'
import type { RaceWeekend } from '../api/types'
import ResultsSidebar from '../components/ResultsSidebar.vue'
import ResultsTable from '../components/ResultsTable.vue'

const router = useRouter()
const route = useRoute()

const seasons = ref<number[]>([])
const selectedSeason = ref<number | null>(null)
const weekends = ref<RaceWeekend[]>([])
const selectedWeekendId = ref<number | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

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

/**
 * Beim initialen Laden:
 * 1. Lädt alle verfügbaren Saisons
 * 2. Prüft ob eine Saison in der URL übergeben wurde
 * 3. Setzt die erste Saison als Standard, wenn keine in URL vorhanden
 */
onMounted(async () => {
  try {
    seasons.value = await getSeasons()
    
    // Prüft die URL nach einer Saison (z.B. ?season=2024)
    const seasonParam = route.query.season ? Number(route.query.season) : null
    if (seasonParam && seasons.value.includes(seasonParam)) {
      selectedSeason.value = seasonParam
    } else if (sortedSeasons.value.length > 0) {
      selectedSeason.value = sortedSeasons.value[0]
    }
  } catch (err) {
    error.value = 'Saisons konnten nicht geladen werden.'
    console.error(err)
  } finally {
    loading.value = false
  }
})

/**
 * Überwacht die ausgewählte Saison
 * Wenn sich die Saison ändert:
 * 1. Lädt die Wochenenden dieser Saison
 * 2. Setzt die Wochenends-Auswahl zurück (null)
 * 3. Aktualisiert die URL
 */
watch(selectedSeason, async (newSeason) => {
  if (newSeason) {
    try {
      weekends.value = await getWeekends(newSeason)
      selectedWeekendId.value = null
      // Aktualisiert die URL ohne die Seite neu zu laden
      router.replace({ query: { season: newSeason } })
    } catch (err) {
      error.value = 'Rennwochenenden konnten nicht geladen werden.'
      console.error(err)
    }
  }
})

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
      :loading="loading"
      :error="error"
      @select-season="selectedSeason = $event"
      @select-weekend="selectedWeekendId = $event"
      @go-home="goHome"
    />

    <main class="results-page__main">
      <ResultsTable
        v-if="selectedWeekendId && selectedWeekend"
        :weekend="selectedWeekend"
      />
      <div v-else class="results-page__empty">
        <p>Wählen Sie ein Rennwochenende aus der Seitenleiste</p>
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
</style>
