<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getSeasons } from './api/endpoints'

const seasons = ref<number[]>([])
const selectedSeason = ref<number | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const sortedSeasons = computed(() => [...seasons.value].sort((a, b) => b - a))

// saisons laden
onMounted(async () => {
  try {
    seasons.value = await getSeasons()
  } catch {
    error.value = 'Saisons konnten nicht geladen werden.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <header class="page__header">
      <img class="logo" src="/f1-logo.svg" alt="Formula 1" width="240" height="60" />
    </header>

    <main class="page__main">
      <p class="page__tagline">
        Rennwochenenden, Sessions und Ergebnisse vergangener Formel-1-Saisons entdecken.
      </p>

      <div class="season-picker">
        <label class="season-picker__label" for="season-select">Saison wählen</label>

        <p v-if="loading" class="season-picker__status">Laden…</p>
        <p v-else-if="error" class="season-picker__error">{{ error }}</p>

        <select
          v-else
          id="season-select"
          v-model="selectedSeason"
          class="season-picker__select"
        >
          <option :value="null" disabled>— Saison auswählen —</option>
          <option v-for="year in sortedSeasons" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
    </main>
  </div>
</template>

<style scoped>
.page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(225, 6, 0, 0.08) 0%, transparent 55%),
    var(--bg);
}

.page__header {
  padding: 28px 32px;
}

.logo {
  display: block;
  width: 240px;
  height: auto;
  user-select: none;
}

.page__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px 80px;
  text-align: center;
}

.page__tagline {
  margin: 0 0 40px;
  max-width: 56ch;
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1.45;
  color: var(--text);
}

.season-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(100%, 280px);
}

.season-picker__label {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
}

.season-picker__select {
  width: 100%;
  cursor: pointer;
  appearance: none;
  padding: 12px 40px 12px 16px;
  font-size: 1rem;
  font-weight: 600;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%238b8b96' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")
      no-repeat right 14px center,
    var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  transition: border-color 0.15s;
}

.season-picker__select:hover,
.season-picker__select:focus {
  outline: none;
  border-color: var(--f1-red);
}

.season-picker__status {
  margin: 0;
  color: var(--text-muted);
}

.season-picker__error {
  margin: 0;
  padding: 10px 14px;
  font-size: 0.875rem;
  color: #ff6b6b;
  background: rgba(225, 6, 0, 0.1);
  border: 1px solid rgba(225, 6, 0, 0.3);
  border-radius: var(--radius);
}
</style>
