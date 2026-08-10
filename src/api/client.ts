/**
 * Basis-URL für alle API-Anfragen
 *
 * Wird über `VITE_API_BASE_URL` gesetzt 
 * In der Entwicklung leitet Vite `/api` an das Backend weiter ( vite.config.ts)
 */
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

/**
 * Fehlerklasse für fehlgeschlagene API-Anfragen
 * Enthält den HTTP-Statuscode neben der Fehlermeldung
 */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Zentraler HTTP-Client für das F1-Backend
 *
 * @param path - Relativer API-Pfad, z. B. `/seasons/` (ohne baseUrl)
 * @param init - Optionale fetch-Optionen (Method, Body, zusätzliche Header)
 * @returns Parsed JSON-Response
 * @throws {ApiError} Bei HTTP-Status >= 400
 *
 * @example
 * const seasons = await apiClient<number[]>('/seasons/')
 */
export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl}${path}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status} ${response.statusText}`,
      response.status,
    )
  }

  return response.json() as Promise<T>
}
