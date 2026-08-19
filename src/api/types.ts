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
