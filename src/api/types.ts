/** Land, in dem ein Grand-Prix-Wochenende stattfindet. */
export interface Country {
  id: number
  name: string
  name_de: string
  alpha3_code: string
  subregion: string
  region: string
  flag_base64: string
}

/** Ein Grand-Prix-Wochenende */
export interface RaceWeekend {
  id: number
  name: string
  country: Country | null
  circuit_id: number
  date_start: string
  date_end: string
  gmt_offset: string
  cancelled: boolean
}

/** Mögliche Session-Typen eines Race Weekends */
export type SessionType =
  | 'practice_one'
  | 'practice_two'
  | 'practice_three'
  | 'sprint'
  | 'sprint_qualifying'
  | 'qualifying'
  | 'grand_prix'

/** Eine einzelne Session (Training, Qualifying, Rennen …) eines Race Weekends */
export interface Session {
  id: number
  type: SessionType
  weekend_id: number
  start_time: string
}

/** Stammdaten eines Fahrers innerhalb einer Saison. */
export interface Driver {
  driver_id: number
  full_name: string
  first_name: string
  last_name: string
  acronym: string
  team_name: string
  portrait_base64: string
}

/** Ein Platz in der Fahrerweltmeisterschaft. */
export interface DriverStanding {
  position: number
  driver_id: number
  points: number
}

/** Fahrerweltmeisterschaft einer Saison. */
export interface DriverStandings {
  season: number
  standings: DriverStanding[]
}

/** Ein Rückgabe-Objekt für Session-Ergebnisse; kann je nach Backend leicht variieren. */
export interface SessionResultEntry {
  id?: number
  driver_name?: string
  driverName?: string
  name?: string
  full_name?: string
  team?: string | { name?: string; full_name?: string } | null
  team_name?: string
  position?: number | string
  rank?: number | string
  points?: number | string
  score?: number | string
  total_points?: number | string
  points_total?: number | string
  data_points?: number | string
  value?: number | string
  [key: string]: unknown
}
