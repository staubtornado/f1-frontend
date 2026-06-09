import type { SessionType } from '../api/types'

const labels: Record<SessionType, string> = {
  practice_one: 'FP1',
  practice_two: 'FP2',
  practice_three: 'FP3',
  sprint: 'Sprint',
  sprint_qualifying: 'Sprint Qualifying',
  qualifying: 'Qualifying',
  grand_prix: 'Grand Prix',
}

export function getSessionLabel(type: SessionType): string {
  return labels[type]
}
