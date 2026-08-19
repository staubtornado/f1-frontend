import { apiClient } from '../client'
import type { RaceWeekend, Session, SessionResultEntry } from '../types'

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
  return apiClient<SessionResultEntry>(`/session/${sessionId}/result/`)
}