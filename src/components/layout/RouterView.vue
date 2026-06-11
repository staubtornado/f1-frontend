<script setup lang="ts">
import type { RaceWeekend } from '../../api/types'

defineProps<{
  collapsed: boolean
  seasons: number[]
  weekends: RaceWeekend[]
  selectedSeason: number | null
  selectedWeekendId: number | null
  error: string | null
}>()

const emit = defineEmits<{
  toggle: []
  selectSeason: [year: number]
  selectWeekend: [weekendId: number]
}>()
</script>

<template>
  <nav class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <div class="sidebar__accent" />

    <button type="button" class="sidebar__toggle" @click="emit('toggle')">
      {{ collapsed ? '»' : '«' }}
    </button>

    <template v-if="!collapsed">
      <h2 class="sidebar__title">
        <span class="sidebar__logo">F1</span>
        Navigation
      </h2>

      <p v-if="error" class="sidebar__error">{{ error }}</p>

      <section class="sidebar__section">
        <h3>Saisons</h3>
        <ul>
          <li v-for="year in seasons" :key="year">
            <button
              type="button"
              class="sidebar__item"
              :class="{ 'sidebar__item--active': selectedSeason === year }"
              @click="emit('selectSeason', year)"
            >
              {{ year }}
            </button>
          </li>
        </ul>
      </section>

      <section v-if="selectedSeason && weekends.length" class="sidebar__section">
        <h3>Weekends {{ selectedSeason }}</h3>
        <ul>
          <li v-for="weekend in weekends" :key="weekend.id">
            <button
              type="button"
              class="sidebar__item sidebar__item--weekend"
              :class="{ 'sidebar__item--active': selectedWeekendId === weekend.id }"
              @click="emit('selectWeekend', weekend.id)"
            >
              {{ weekend.name }}
            </button>
          </li>
        </ul>
      </section>
    </template>
  </nav>
</template>

<style scoped>
.sidebar {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--bg-sidebar);
  padding: 16px 14px;
  overflow-y: auto;
}

.sidebar--collapsed {
  width: 58px;
  padding: 16px 10px;
}

.sidebar__accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--f1-red) 0%, var(--f1-red-dim) 100%);
}

.sidebar__toggle {
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  border-radius: var(--radius);
  padding: 6px 12px;
  margin: 8px 0 16px;
  color: var(--text-muted);
  transition: border-color 0.15s, color 0.15s;
}

.sidebar__toggle:hover {
  border-color: var(--f1-red);
  color: var(--text);
}

.sidebar__title {
  margin: 0 0 1.25rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  background: var(--f1-red);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 2px;
}

.sidebar__section {
  margin-bottom: 1.5rem;
}

.sidebar__section h3 {
  margin: 0 0 10px;
  padding-left: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-dim);
  border-left: 2px solid var(--f1-red);
}

.sidebar__section ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
}

.sidebar__item {
  width: 100%;
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  background: transparent;
  border-radius: var(--radius);
  padding: 9px 10px;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.sidebar__item:hover {
  background: var(--bg-elevated);
  color: var(--text);
}

.sidebar__item--active {
  background: rgba(225, 6, 0, 0.1);
  border-left-color: var(--f1-red);
  color: var(--text);
}

.sidebar__item--weekend {
  font-size: 0.875rem;
}

.sidebar__error {
  margin: 0 0 12px;
  padding: 8px 10px;
  font-size: 0.8rem;
  color: #ff6b6b;
  background: rgba(225, 6, 0, 0.12);
  border: 1px solid rgba(225, 6, 0, 0.3);
  border-radius: var(--radius);
}
</style>
