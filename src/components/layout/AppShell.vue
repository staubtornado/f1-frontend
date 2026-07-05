// Main App Shell component
/7 This Component is the main container for the app and contains the sidebar and main content
// It handles the variables and functions for the app and passes them to the sidebar and main content components

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { apiClient } from '../../api/client'
import { getSeasons } from '../../api/endpoints/seasons'
import type { RaceWeekend, Session } from '../../api/types'
import MainContent from './MainContent.vue'
import SidebarNav from './RouterView.vue'

const collapsed = ref(false) // State variable for the collapsed state of the sidebar
const seasons = ref<number[]>([]) // State variable for the seasons
const weekends = ref<RaceWeekend[]>([]) // State variable for the weekends
const sessions = ref<Session[]>([]) // State variable for the sessions
const selectedSeason = ref<number | null>(null) // State variable for the selected season
const selectedWeekendId = ref<number | null>(null) // State variable for the selected weekend id
const loading = ref(false) // State variable for the loading state
const error = ref<string | null>(null) // State variable for the error

onMounted(async () => { // Lifecycle hook to fetch the seasons from the backend
  try {
    seasons.value = await getSeasons() // apiClient call to get the seasons from the backend
  } catch {
    error.value = 'Backend nicht erreichbar'
  }
})

watch(selectedSeason, async (year) => { // Watch for changes in the selected season
  selectedWeekendId.value = null
  sessions.value = []
  weekends.value = []

  if (year === null) return

  loading.value = true
  error.value = null
  try {
    weekends.value = await apiClient<RaceWeekend[]>(`/seasons/${year}/weekends/`) // apiClient call to get the weekends from the backend
  } catch {
    error.value = 'Race Weekends konnten nicht geladen werden'
  } finally {
    loading.value = false
  }
})

watch(selectedWeekendId, async (weekendId) => { // Watch for changes in the selected weekend id
  sessions.value = []
  if (weekendId === null) return

  loading.value = true
  error.value = null
  try {
    sessions.value = await apiClient<Session[]>(`/weekend/${weekendId}/sessions/`) // apiClient call to get the sessions from the backend
  } catch {
    error.value = 'Sessions konnten nicht geladen werden'
  } finally {
    loading.value = false
  }
})

function onSelectSeason(year: number) {
  selectedSeason.value = selectedSeason.value === year ? null : year
}

function onSelectWeekend(weekendId: number) {
  selectedWeekendId.value = selectedWeekendId.value === weekendId ? null : weekendId
}
</script>

<template>
  <div class="shell" :class="{ 'shell--collapsed': collapsed }">
    <SidebarNav
      :collapsed="collapsed"
      :seasons="seasons"
      :weekends="weekends"
      :selected-season="selectedSeason"
      :selected-weekend-id="selectedWeekendId"
      :error="error"
      @toggle="collapsed = !collapsed"
      @select-season="onSelectSeason"
      @select-weekend="onSelectWeekend"
    />
    <MainContent
      :loading="loading"
      :error="error"
      :selected-season="selectedSeason"
      :selected-weekend-id="selectedWeekendId"
      :weekends="weekends"
      :sessions="sessions"
    />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100svh;
  background: var(--bg);
}
</style>
