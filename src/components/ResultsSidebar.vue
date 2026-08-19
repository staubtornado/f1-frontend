/**
 * ResultsSidebar Component
 * 
 * Linke Seitenleiste mit Navigation
 * 
 * Funktionen:
 * 1. HOME BUTTON: Rückkehr zur Startseite
 * 2. SAISON-LISTE: Alle verfügbaren Saisons (sortiert, neueste zuerst)
 * 3. WOCHENENDEN-LISTE: Wochenenden der ausgewählten Saison
 *    - Jedes Wochenende zeigt den Namen und das Start-Datum
 *    - Aktiv ausgewähltes Wochenende ist visuell hervorgehoben
 * 
 * Emits:
 * - select-season: Wenn der Benutzer auf eine Saison klickt
 * - select-weekend: Wenn der Benutzer auf ein Wochenende klickt
 * - go-home: Wenn der Home-Button geklickt wird
 */

<script setup lang="ts">
import type { RaceWeekend } from '../api/types'

interface Props {
  seasons: number[]
  weekends: RaceWeekend[]
  selectedSeason: number | null
  selectedWeekendId: number | null
  loading: boolean
  error: string | null
}

defineProps<Props>()
defineEmits<{
  'select-season': [season: number]
  'select-weekend': [weekendId: number]
  'go-home': []
}>()

/**
 * Formatiert ein Datum im Format DD.MM (z.B. "15.03")
 * @param dateStr - ISO Datum String
 * @returns Formatiertes Datum
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__header">
      <button class="sidebar__home-btn" @click="$emit('go-home')" aria-label="Zur Startseite">
        <img src="/f1-logo.svg" alt="F1" width="40" height="40" />
      </button>
    </div>

    <nav class="sidebar__nav">
      <div class="sidebar__section">
        <h2 class="sidebar__title">Saisons</h2>

        <p v-if="loading" class="sidebar__status">Laden…</p>
        <p v-else-if="error" class="sidebar__error">{{ error }}</p>

        <ul v-else class="sidebar__list">
          <li v-for="season in seasons" :key="season">
            <button
              class="sidebar__button"
              :class="{ 'sidebar__button--active': selectedSeason === season }"
              @click="$emit('select-season', season)"
            >
              {{ season }}
            </button>
          </li>
        </ul>
      </div>

      <div v-if="selectedSeason" class="sidebar__section">
        <h2 class="sidebar__title">Wochenenden</h2>

        <ul v-if="weekends.length > 0" class="sidebar__list">
          <li v-for="weekend in weekends" :key="weekend.id">
            <button
              class="sidebar__button sidebar__button--weekend"
              :class="{ 'sidebar__button--active': selectedWeekendId === weekend.id }"
              @click="$emit('select-weekend', weekend.id)"
            >
              <span class="sidebar__weekend-name">{{ weekend.name }}</span>
              <span class="sidebar__weekend-date">{{ formatDate(weekend.date_start) }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="sidebar__empty">Keine Wochenenden verfügbar</p>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 100svh;
}

.sidebar__header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar__home-btn {
  background: none;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 100%;
}

.sidebar__home-btn:hover {
  border-color: rgba(225, 6, 0, 1);
  background-color: rgba(225, 6, 0, 0.1);
}

.sidebar__nav {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar__title {
  margin: 0;
  padding: 0 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar__status,
.sidebar__error,
.sidebar__empty {
  padding: 8px;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar__error {
  color: #ff6b6b;
}

.sidebar__button {
  background: none;
  border: 1px solid transparent;
  color: var(--text);
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sidebar__button:hover {
  background-color: rgba(225, 6, 0, 0.1);
  border-color: rgba(225, 6, 0, 0.5);
}

.sidebar__button--active {
  background-color: rgba(225, 6, 0, 0.2);
  border-color: rgba(225, 6, 0, 1);
  font-weight: 600;
}

.sidebar__button--weekend {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.sidebar__weekend-name {
  font-size: 0.95rem;
}

.sidebar__weekend-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }
}
</style>
