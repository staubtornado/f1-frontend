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
    <p v-if="loading" class="main__status">
      <span class="main__spinner" />
      Laden…
    </p>

    <section v-else-if="!selectedSeason" class="main__welcome">
      <p class="main__eyebrow">Formula 1</p>
      <h1>F1 Frontend</h1>
      <p class="main__lead">Wähle links in der Navigation eine Saison aus.</p>
    </section>

    <section v-else-if="!selectedWeekendId" class="main__welcome">
      <p class="main__eyebrow">Saison {{ selectedSeason }}</p>
      <h1>Race Weekends</h1>
      <p class="main__lead">
        {{ weekends.length }} Weekends verfügbar — wähle eines in der Navigation.
      </p>
    </section>

    <section v-else class="main__detail">
      <p class="main__eyebrow">Saison {{ selectedSeason }}</p>
      <h1>{{ findWeekend(weekends, selectedWeekendId)?.name ?? 'Weekend' }}</h1>
      <p v-if="error" class="main__error">{{ error }}</p>
      <ul v-else class="session-list">
        <li v-for="session in sessions" :key="session.id">
          <span class="session-list__type">{{ getSessionLabel(session.type) }}</span>
          <time>{{ formatDateTime(session.start_time) }}</time>
        </li>
      </ul>
      <p v-if="!error && sessions.length === 0" class="main__lead">Keine Sessions gefunden.</p>
    </section>
  </main>
</template>

<style scoped>
.main {
  flex: 1;
  padding: 32px 40px;
  background:
    radial-gradient(ellipse at top right, rgba(225, 6, 0, 0.06) 0%, transparent 55%),
    var(--bg);
}

.main__eyebrow {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--f1-red);
}

.main__welcome h1,
.main__detail h1 {
  margin: 0 0 12px;
}

.main__lead {
  margin: 0;
  color: var(--text-muted);
  max-width: 36ch;
}

.main__status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
}

.main__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--f1-red);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.main__error {
  padding: 10px 14px;
  color: #ff6b6b;
  background: rgba(225, 6, 0, 0.1);
  border: 1px solid rgba(225, 6, 0, 0.3);
  border-radius: var(--radius);
}

.session-list {
  list-style: none;
  margin: 24px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
  max-width: 520px;
}

.session-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--f1-red);
  border-radius: var(--radius);
  transition: border-color 0.15s;
}

.session-list li:hover {
  border-color: var(--border);
  border-left-color: var(--f1-red);
}

.session-list__type {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
}

time {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
</style>
