import { apiClient } from '../client'

export async function getSeasons() {
  return apiClient<number[]>('/seasons/')
}