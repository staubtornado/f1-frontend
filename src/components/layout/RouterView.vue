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
    <button type="button" class="sidebar__toggle" @click="emit('toggle')">
      {{ collapsed ? '»' : '«' }}
    </button>

    <template v-if="!collapsed">
      <h2 class="sidebar__title">Navigation</h2>

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
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid #e5e4e7;
  background: #fafafa;
  padding: 12px;
  box-sizing: border-box;
  overflow-y: auto;
}

.sidebar--collapsed {
  width: 58px;
  padding: 14px 10px;
}

.sidebar__toggle {
  font: inherit;
  cursor: pointer;
  border: 1px solid #e5e4e7;
  background: #fff;
  border-radius: 6px;
  padding: 4px 10px;
  margin-bottom: 12px;
}

.sidebar__title {
  margin: 0 0 0.75em;
  font-size: 1em;
}

.sidebar__section {
  margin-bottom: 20px;
}

.sidebar__section h3 {
  margin: 0 0 8px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b6375;
}

.sidebar__section ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}

.sidebar__item {
  width: 100%;
  text-align: left;
  font: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  padding: 8px 10px;
}

.sidebar__item:hover {
  background: #f0f0f0;
}

.sidebar__item--active {
  background: rgba(170, 59, 255, 0.1);
  border-color: rgba(170, 59, 255, 0.4);
}

.sidebar__item--weekend {
  font-size: 14px;
}

.sidebar__error {
  margin: 0 0 12px;
  font-size: 13px;
  color: #b91c1c;
}
</style>
