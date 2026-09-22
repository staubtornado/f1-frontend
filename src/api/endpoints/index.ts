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
export function getSeasons(signal?: AbortSignal) {
  return apiClient<number[]>('/seasons/', { signal })
}

/**
 * Race Weekends einer Saison abrufen
 *
 * @endpoint GET /seasons/{year}/weekends/
 * @param year - Saison-Jahr
 */
export function getWeekends(year: number, signal?: AbortSignal) {
  return apiClient<RaceWeekend[]>(`/seasons/${year}/weekends/`, { signal })
}

/**
 * Sessions eines Race Weekends abrufen
 *
 * @endpoint GET /weekend/{weekendId}/sessions/
 * @param weekendId - Race Weekend ID
 */
export function getSessions(weekendId: number, signal?: AbortSignal) {
  return apiClient<Session[]>(`/weekend/${weekendId}/sessions/`, { signal })
}

export function getSessionResults(sessionId: number, signal?: AbortSignal) {
  return apiClient<SessionResult>(`/session/${sessionId}/result/`, { signal })
}

export function getDriverStandings(season: number, signal?: AbortSignal) {
  return apiClient<DriverStandings>(`/standings/${season}/driver_standings/`, { signal })
}

export function getTeamStandings(season: number, signal?: AbortSignal) {
  return apiClient<TeamStandings>(`/standings/${season}/team_standings/`, { signal })
}

export function getSeasonDriver(season: number, driverId: number, signal?: AbortSignal) {
  return apiClient<Driver>(`/seasons/${season}/drivers/${driverId}/`, { signal })
}

//export function getStartingGrid(sessionId: number) {
  //return apiClient<StartingGrid>(`/session/${sessionId}/starting_grid/`)
//}
