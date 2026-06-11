<script setup lang="ts">
import type { RaceWeekend, Session } from '../../api/types'
import { formatDateTime } from '../../utils/formatDate'
import { getSessionLabel } from '../../utils/sessionLabels'

defineProps<{
  loading: boolean
  error: string | null
  selectedSeason: number | null
  selectedWeekendId: number | null
  weekends: RaceWeekend[]
  sessions: Session[]
}>()

function findWeekend(weekends: RaceWeekend[], id: number | null) {
  return weekends.find((w) => w.id === id) ?? null
}
</script>

<template>
  <main class="main">
    <p v-if="loading" class="main__status">Laden…</p>

    <section v-else-if="!selectedSeason" class="main__welcome">
      <h1>F1 Frontend</h1>
      <p>Wähle bitte links in der Navigation eine Saison aus.</p>
    </section>

    <section v-else-if="!selectedWeekendId" class="main__welcome">
      <h1>Saison {{ selectedSeason }}</h1>
      <p>{{ weekends.length }} Race Weekends — wähle bitte eines in der Navigation.</p>
    </section>

    <section v-else class="main__detail">
      <h1>{{ findWeekend(weekends, selectedWeekendId)?.name ?? 'Weekend' }}</h1>
      <p v-if="error" class="main__error">{{ error }}</p>
      <ul v-else class="session-list">
        <li v-for="session in sessions" :key="session.id">
          <span class="session-list__type">{{ getSessionLabel(session.type) }}</span>
          <time>{{ formatDateTime(session.start_time) }}</time>
        </li>
      </ul>
      <p v-if="!error && sessions.length === 0">Keine Sessions gefunden.</p>
    </section>
  </main>
</template>

<style scoped>
.main {
  flex: 1;
  padding: 24px;
  box-sizing: border-box;
}

.main__welcome h1,
.main__detail h1 {
  margin-top: 0;
}

.main__status,
.main__error {
  color: #6b6375;
}

.main__error {
  color: #b91c1c;
}

.session-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  max-width: 480px;
}

.session-list li {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 14px;
  border: 1px solid #e5e4e7;
  border-radius: 8px;
}

.session-list__type {
  font-weight: 500;
}
</style>
