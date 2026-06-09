export interface Country {
  id: number
  name: string
  name_de: string
  alpha3_code: string
  subregion: string
  region: string
  flag_base64: string
}

export interface RaceWeekend {
  name: string
  id: number
  country: Country | null
  circuit_id: number
  date_start: string
  date_end: string
  gmt_offset: string
  cancelled: boolean
}

export type SessionType =
  | 'practice_one'
  | 'practice_two'
  | 'practice_three'
  | 'sprint'
  | 'sprint_qualifying'
  | 'qualifying'
  | 'grand_prix'

export interface Session {
  id: number
  type: SessionType
  weekend_id: number
  start_time: string
}
