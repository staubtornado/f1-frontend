import { apiClient } from '../client'
import type {
  Driver,
  DriverStandings,
  RaceWeekend,
  Session,
  SessionResult,
  TeamStandings,
} from '../types'

/**
 * Alle verfügbaren Saisons abrufen
 *
 * @endpoint GET /seasons/
 * @returns Sortierte Liste von Jahreszahlen
 */
export function getSeasons() {
  return apiClient<number[]>('/seasons/')
}

/**
 * Race Weekends einer Saison abrufen
 *
 * @endpoint GET /seasons/{year}/weekends/
 * @param year - Saison-Jahr
 */
export function getWeekends(year: number) {
  return apiClient<RaceWeekend[]>(`/seasons/${year}/weekends/`)
}

/**
 * Sessions eines Race Weekends abrufen
 *
 * @endpoint GET /weekend/{weekendId}/sessions/
 * @param weekendId - Race Weekend ID
 */
export function getSessions(weekendId: number) {
  return apiClient<Session[]>(`/weekend/${weekendId}/sessions/`)
}

export function getSessionResults(sessionId: number) {
  return apiClient<SessionResult>(`/session/${sessionId}/result/`)
}

export function getDriverStandings(season: number) {
  return apiClient<DriverStandings>(`/standings/${season}/driver_standings/`)
}

export function getTeamStandings(season: number) {
  return apiClient<TeamStandings>(`/standings/${season}/team_standings/`)
}

export function getSeasonDriver(season: number, driverId: number) {
  return apiClient<Driver>(`/seasons/${season}/drivers/${driverId}/`)
}
