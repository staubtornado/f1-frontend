<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { apiClient } from '../../api/client'
import { getSeasons } from '../../api/endpoints/seasons'
import type { RaceWeekend, Session } from '../../api/types'
import MainContent from './MainContent.vue'
import SidebarNav from './RouterView.vue'

const collapsed = ref(false)
const seasons = ref<number[]>([])
const weekends = ref<RaceWeekend[]>([])
const sessions = ref<Session[]>([])
const selectedSeason = ref<number | null>(null)
const selectedWeekendId = ref<number | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    seasons.value = await getSeasons()
  } catch {
    error.value = 'Backend nicht erreichbar'
  }
})

watch(selectedSeason, async (year) => {
  selectedWeekendId.value = null
  sessions.value = []
  weekends.value = []

  if (year === null) return

  loading.value = true
  error.value = null
  try {
    weekends.value = await apiClient<RaceWeekend[]>(`/seasons/${year}/weekends/`)
  } catch {
    error.value = 'Race Weekends konnten nicht geladen werden'
  } finally {
    loading.value = false
  }
})

watch(selectedWeekendId, async (weekendId) => {
  sessions.value = []
  if (weekendId === null) return

  loading.value = true
  error.value = null
  try {
    sessions.value = await apiClient<Session[]>(`/weekend/${weekendId}/sessions/`)
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
}
</style>
