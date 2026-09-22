<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getDriverStandings, getSeasonDriver, getTeamStandings } from '../api/endpoints'
import type { Driver, DriverStanding, TeamStanding } from '../api/types'
import DriverDetailsModal from './DriverDetailsModal.vue'

interface Props {
  season: number
}

interface DriverStandingRow extends DriverStanding {
  driver: Driver | null
}

const props = defineProps<Props>()

const driverRows = ref<DriverStandingRow[]>([])
const teamRows = ref<TeamStanding[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const teamError = ref<string | null>(null)
let loadRequestId = 0
const selectedDriverId = ref<number | null>(null)

const getDriverLabel = (row: DriverStandingRow): string => {
  return row.driver?.full_name ?? `Fahrer #${row.driver_id}`
}

const getTeamLabel = (row: DriverStandingRow): string => {
  return row.driver?.team_name ?? 'Team unbekannt'
}

const loadStandings = async () => {
  const requestId = ++loadRequestId
  loading.value = true
  error.value = null
  teamError.value = null
  driverRows.value = []
  teamRows.value = []

  try {
    const [standings, teamStandings] = await Promise.all([
      getDriverStandings(props.season),
      getTeamStandings(props.season).catch((caughtError: unknown) => {
        if (requestId === loadRequestId) {
          teamError.value = 'Teamwertung konnte nicht geladen werden.'
          console.error(caughtError)
        }
        return null
      }),
    ])
    const rows = await Promise.all(
      standings.standings.map(async (standing): Promise<DriverStandingRow> => {
        try {
          const driver = await getSeasonDriver(props.season, standing.driver_id)
          return { ...standing, driver }
        } catch {
          return { ...standing, driver: null }
        }
      }),
    )

    if (requestId !== loadRequestId) return

    driverRows.value = rows.sort((first, second) => first.position - second.position)
    teamRows.value = (teamStandings?.standings ?? [])
      .slice()
      .sort((first, second) => first.position - second.position)
  } catch (caughtError) {
    if (requestId !== loadRequestId) return

    error.value = 'Weltmeisterschaft konnte nicht geladen werden.'
    console.error(caughtError)
  } finally {
    if (requestId === loadRequestId) loading.value = false
  }
}

onMounted(loadStandings)
watch(() => props.season, loadStandings)
</script>

<template>
  <section class="standings" aria-labelledby="standings-title">
    <header class="standings__header">
      <p class="standings__eyebrow">Saison {{ season }}</p>
      <h1 id="standings-title" class="standings__title">Weltmeisterschaft</h1>
    </header>

    <p v-if="loading" class="standings__status">Weltmeisterschaft wird geladen…</p>
    <p v-else-if="error" class="standings__status standings__status--error">{{ error }}</p>

    <div v-else-if="driverRows.length > 0 || teamRows.length > 0 || teamError" class="standings__grid">
      <section class="standings-card" aria-labelledby="drivers-title">
        <h2 id="drivers-title" class="standings-card__title">Fahrer</h2>
        <table class="standings-table">
          <thead>
            <tr>
              <th scope="col">Pos.</th>
              <th scope="col">Fahrer</th>
              <th scope="col">Punkte</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in driverRows" :key="row.driver_id">
              <td class="standings-table__position">{{ row.position }}</td>
              <td>
                <button
                  class="standings-table__name standings-table__driver-link"
                  type="button"
                  :disabled="!row.driver"
                  @click="selectedDriverId = row.driver_id"
                >{{ getDriverLabel(row) }}</button>
                <span class="standings-table__team"> | {{ getTeamLabel(row) }}</span>
              </td>
              <td class="standings-table__points">{{ row.points }} PTS</td>
           </tr>
          </tbody>
        </table>
      </section>

      <section class="standings-card" aria-labelledby="teams-title">
        <h2 id="teams-title" class="standings-card__title">Teams</h2>
        <p v-if="teamError" class="standings__status standings__status--error">{{ teamError }}</p>
        <p v-else-if="teamRows.length === 0" class="standings__status">Keine Teamwertung verfügbar.</p>
        <table v-else class="standings-table">
          <thead>
            <tr>
              <th scope="col">Pos.</th>
              <th scope="col">Team</th>
              <th scope="col">Punkte</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="team in teamRows" :key="team.team_name">
              <td class="standings-table__position">{{ team.position }}</td>
              <td class="standings-table__name">{{ team.team_name }}</td>
              <td class="standings-table__points">{{ team.points }} PTS</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>

    <p v-else class="standings__status">Für diese Saison sind keine Wertungen verfügbar.</p>

    <DriverDetailsModal
      :open="selectedDriverId !== null"
      :season="season"
      :driver-id="selectedDriverId"
      @close="selectedDriverId = null"
    />
  </section>
</template>

<style scoped>
.standings {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.standings__header {
  margin-bottom: 28px;
}

.standings__eyebrow {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.standings__title,
.standings-card__title {
  margin: 0;
}

.standings__title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
}

.standings__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.standings-card {
  overflow: hidden;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.standings-card__title {
  padding: 16px 20px;
  font-size: 1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 2px solid var(--f1-red);
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
}

.standings-table th,
.standings-table td {
  padding: 14px 20px;
  text-align: left;
}

.standings-table th {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.standings-table td {
  border-top: 1px solid var(--border);
}

.standings-table tbody tr:hover {
  background: rgba(225, 6, 0, 0.08);
}

.standings-table__position {
  width: 68px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.standings-table__name {
  font-weight: 600;
}

.standings-table__driver-link {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.standings-table__driver-link:hover,
.standings-table__driver-link:focus-visible {
  color: var(--f1-red);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.standings-table__driver-link:disabled {
  cursor: default;
  text-decoration: none;
}

.standings-table__team {
  color: var(--text-muted);
}

.standings-table__points {
  width: 110px;
  text-align: right !important;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.standings__status {
  margin: 0;
  padding: 48px 24px;
  color: var(--text-muted);
  text-align: center;
}

.standings__status--error {
  color: #ff6b6b;
}

@media (max-width: 850px) {
  .standings__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .standings-table th,
  .standings-table td {
    padding: 12px;
  }

  .standings-table__position {
    width: 48px;
  }
}
</style>
