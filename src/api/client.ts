/**
 * Basis-URL für alle API-Anfragen
 *
 * Wird über `VITE_API_BASE_URL` gesetzt 
 * In der Entwicklung leitet Vite `/api` an das Backend weiter ( vite.config.ts)
 */
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')
const requestTimeoutMs = 45_000

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

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiError && (error.status === 408 || error.status === 504)) {
    return 'Der Server antwortet nicht rechtzeitig. Bitte erneut versuchen.'
  }
  return fallback
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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const headers = new Headers(init?.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  const controller = new AbortController()
  let timedOut = false
  const abortFromCaller = () => controller.abort(init?.signal?.reason)
  if (init?.signal?.aborted) abortFromCaller()
  else init?.signal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeoutId = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, requestTimeoutMs)

  try {
    const response = await fetch(`${baseUrl}${normalizedPath}`, {
      ...init,
      headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ApiError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status,
      )
    }

    return await response.json() as T
  } catch (error) {
    if (timedOut) throw new ApiError('Request timed out', 408)
    throw error
  } finally {
    clearTimeout(timeoutId)
    init?.signal?.removeEventListener('abort', abortFromCaller)
  }
}
