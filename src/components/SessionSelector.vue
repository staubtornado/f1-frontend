<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getWeekends, getSessions } from '../api/endpoints'
import type { RaceWeekend, Session } from '../api/types'

interface Props {
  season: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  'select-session': [sessionId: number]
}>()

const weekends = ref<RaceWeekend[]>([])
const expandedWeekendId = ref<number | null>(null)
const sessionsByWeekend = ref<Map<number, Session[]>>(new Map())
const loading = ref(false)
const error = ref<string | null>(null)

const sortedWeekends = computed(() => [...weekends.value].sort((a, b) => {
  return new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
}))

watch(
  () => weekends.value,
  async () => {
    // Load sessions for all weekends when they're loaded
    for (const weekend of weekends.value) {
      if (!sessionsByWeekend.value.has(weekend.id)) {
        try {
          const sessions = await getSessions(weekend.id)
          sessionsByWeekend.value.set(weekend.id, sessions)
        } catch (err) {
          console.error(`Failed to load sessions for weekend ${weekend.id}:`, err)
        }
      }
    }
  }
)

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    weekends.value = await getWeekends(props.season)
  } catch (err) {
    error.value = 'Rennwochenenden konnten nicht geladen werden.'
    console.error(err)
  } finally {
    loading.value = false
  }
})

const toggleWeekend = (weekendId: number) => {
  expandedWeekendId.value = expandedWeekendId.value === weekendId ? null : weekendId
}

const getSessionTypeName = (type: string): string => {
  const names: Record<string, string> = {
    practice_one: 'Freies Training 1',
    practice_two: 'Freies Training 2',
    practice_three: 'Freies Training 3',
    sprint: 'Sprint',
    sprint_qualifying: 'Sprint-Qualifying',
    qualifying: 'Qualifying',
    grand_prix: 'Grand Prix'
  }
  return names[type] || type
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const selectSession = (sessionId: number) => {
  emit('select-session', sessionId)
}
</script>

<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal__header">
        <h2 class="modal__title">Saison {{ season }} - Wochenende wählen</h2>
        <button class="modal__close" @click="$emit('close')" aria-label="Schließen">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      <div class="modal__body">
        <aside class="sidebar">
          <p v-if="loading" class="sidebar__status">Laden…</p>
          <p v-else-if="error" class="sidebar__error">{{ error }}</p>

          <nav v-else class="weekends-list">
            <div
              v-for="weekend in sortedWeekends"
              :key="weekend.id"
              class="weekend-item"
            >
              <button
                class="weekend-item__header"
                :class="{ 'weekend-item__header--expanded': expandedWeekendId === weekend.id }"
                @click="toggleWeekend(weekend.id)"
              >
                <span class="weekend-item__name">{{ weekend.name }}</span>
                <span class="weekend-item__date">{{ formatDate(weekend.date_start) }}</span>
                <span class="weekend-item__toggle" aria-hidden="true">›</span>
              </button>

              <transition name="expand">
                <div v-if="expandedWeekendId === weekend.id" class="sessions-list">
                  <p v-if="sessionsByWeekend.get(weekend.id)?.length === 0" class="sessions-list__empty">
                    Keine Sessions verfügbar
                  </p>
                  <button
                    v-for="session in sessionsByWeekend.get(weekend.id) || []"
                    :key="session.id"
                    class="session-button"
                    @click="selectSession(session.id)"
                  >
                    {{ getSessionTypeName(session.type) }}
                  </button>
                </div>
              </transition>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: var(--bg);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  width: 100%;
  max-width: 900px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.1));
}

.modal__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
}

.modal__close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--text);
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.modal__close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.sidebar {
  padding: 16px;
}

.sidebar__status,
.sidebar__error {
  text-align: center;
  padding: 32px 16px;
  color: var(--text);
}

.sidebar__error {
  color: #ff6b6b;
}

.weekends-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weekend-item {
  border: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  overflow: hidden;
}

.weekend-item__header {
  width: 100%;
  background: none;
  border: none;
  padding: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: background-color 0.2s;
  color: var(--text);
  font-size: 1rem;
}

.weekend-item__header:hover {
  background-color: rgba(225, 6, 0, 0.1);
}

.weekend-item__header--expanded {
  background-color: rgba(225, 6, 0, 0.1);
}

.weekend-item__name {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.weekend-item__date {
  font-size: 0.875rem;
  color: var(--text, rgba(255, 255, 255, 0.6));
}

.weekend-item__toggle {
  font-size: 1.5rem;
  transition: transform 0.2s;
  color: rgba(225, 6, 0, 1);
}

.weekend-item__header--expanded .weekend-item__toggle {
  transform: rotate(90deg);
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 16px;
  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.1));
  background-color: rgba(0, 0, 0, 0.2);
}

.sessions-list__empty {
  padding: 16px;
  text-align: center;
  color: var(--text, rgba(255, 255, 255, 0.6));
  margin: 0;
}

.session-button {
  background: none;
  border: 1px solid rgba(225, 6, 0, 0.5);
  color: var(--text);
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.session-button:hover {
  background-color: rgba(225, 6, 0, 0.3);
  border-color: rgba(225, 6, 0, 1);
}

.session-button:active {
  background-color: rgba(225, 6, 0, 0.4);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
}

.expand-enter-from {
  max-height: 0;
  opacity: 0;
}

.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .modal {
    max-width: 100%;
    max-height: 90vh;
  }

  .modal__header {
    padding: 16px;
  }

  .modal__title {
    font-size: 1.25rem;
  }
}
</style>
