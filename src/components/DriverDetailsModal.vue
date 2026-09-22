<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getSeasonDriver } from '../api/endpoints'
import type { Driver } from '../api/types'

interface Props {
  open: boolean
  season: number
  driverId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const driver = ref<Driver | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const portraitFailed = ref(false)
let requestId = 0

const portraitSrc = computed(() => {
  const portrait = driver.value?.portrait_base64
  if (!portrait) return ''
  if (portrait.startsWith('data:')) return portrait

  const mimeType = portrait.startsWith('iVBORw0KGgo')
    ? 'image/png'
    : portrait.startsWith('UklGR')
      ? 'image/webp'
      : portrait.startsWith('R0lGOD')
        ? 'image/gif'
        : 'image/jpeg'
  return `data:${mimeType};base64,${portrait}`
})

const loadDriver = async () => {
  const currentRequest = ++requestId
  driver.value = null
  error.value = null
  portraitFailed.value = false

  if (!props.open || props.driverId === null) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const loadedDriver = await getSeasonDriver(props.season, props.driverId)
    if (currentRequest === requestId) driver.value = loadedDriver
  } catch {
    if (currentRequest === requestId) error.value = 'Fahrerinformationen konnten nicht geladen werden.'
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => [props.open, props.season, props.driverId] as const, loadDriver, { immediate: true })

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) emit('close')
}

if (typeof window !== 'undefined') window.addEventListener('keydown', closeOnEscape)
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="driver-modal-backdrop" @click.self="emit('close')">
      <section
        class="driver-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Fahrerinformationen"
        :aria-labelledby="driver ? 'driver-modal-title' : undefined"
        :aria-describedby="driver ? 'driver-modal-description' : undefined"
      >
        <button class="driver-modal__close" type="button" aria-label="Fahrer-Popup schließen" @click="emit('close')">
          ×
        </button>

        <p v-if="loading" class="driver-modal__status" role="status">Fahrerinformationen werden geladen…</p>
        <p v-else-if="error" class="driver-modal__status driver-modal__status--error" role="alert">{{ error }}</p>

        <div v-else-if="driver" class="driver-card">
          <div class="driver-card__portrait-wrap">
            <img
              v-if="portraitSrc && !portraitFailed"
              class="driver-card__portrait"
              :src="portraitSrc"
              :alt="`Porträt von ${driver.full_name}`"
              @error="portraitFailed = true"
            />
            <div v-else class="driver-card__portrait-placeholder" aria-hidden="true">
              {{ driver.acronym }}
            </div>
            <p class="driver-card__number">{{ driver.driver_id }}</p>
          </div>

          <div class="driver-card__info">
            <p class="driver-card__eyebrow">Fahrerprofil · Saison {{ season }}</p>
            <h2 id="driver-modal-title" class="driver-card__name">{{ driver.full_name }}</h2>
            <p id="driver-modal-description" class="driver-card__team">{{ driver.team_name }}</p>

            <dl class="driver-card__facts">
              <div>
                <dt>Kürzel</dt>
                <dd>{{ driver.acronym }}</dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>{{ driver.team_name }}</dd>
              </div>
              <div>
                <dt>Startnummer</dt>
                <dd>{{ driver.driver_id }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.driver-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(0 0 0 / 78%);
  backdrop-filter: blur(5px);
}

.driver-modal {
  position: relative;
  width: min(760px, 100%);
  min-height: 300px;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 12px;
  background: #252532;
  box-shadow: 0 24px 80px rgb(0 0 0 / 55%);
}

.driver-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 6px;
  background: rgb(0 0 0 / 34%);
  color: white;
  font-size: 1.65rem;
  line-height: 1;
  cursor: pointer;
}

.driver-modal__close:hover,
.driver-modal__close:focus-visible {
  border-color: var(--f1-red);
  outline: 2px solid var(--f1-red);
  outline-offset: 2px;
}

.driver-modal__status {
  display: grid;
  min-height: 300px;
  margin: 0;
  padding: 32px;
  place-items: center;
  text-align: center;
  color: var(--text-muted);
}

.driver-modal__status--error {
  color: #ff8a84;
}

.driver-card {
  display: grid;
  min-height: 340px;
  grid-template-columns: minmax(220px, 0.85fr) minmax(0, 1.15fr);
}

.driver-card__portrait-wrap {
  position: relative;
  min-height: 340px;
  overflow: hidden;
  background: linear-gradient(145deg, #353545, #17171f);
}

.driver-card__portrait,
.driver-card__portrait-placeholder {
  width: 100%;
  height: 100%;
  min-height: 340px;
  object-fit: cover;
  object-position: center top;
}

.driver-card__portrait-placeholder {
  display: grid;
  place-items: center;
  color: rgb(255 255 255 / 22%);
  font-size: clamp(3rem, 12vw, 6rem);
  font-weight: 700;
}

.driver-card__number {
  position: absolute;
  right: 16px;
  bottom: 8px;
  margin: 0;
  color: white;
  font-size: clamp(3rem, 9vw, 5.5rem);
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 2px 16px rgb(0 0 0 / 75%);
}

.driver-card__info {
  align-self: center;
  padding: 48px 36px 36px;
}

.driver-card__eyebrow {
  margin: 0 0 8px;
  color: var(--f1-red);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.driver-card__name {
  margin: 0;
  font-size: clamp(1.6rem, 4vw, 2.25rem);
  line-height: 1.1;
}

.driver-card__team {
  margin: 8px 0 28px;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.driver-card__facts {
  display: grid;
  gap: 0;
  margin: 0;
  border-top: 1px solid rgb(255 255 255 / 13%);
}

.driver-card__facts > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid rgb(255 255 255 / 13%);
}

.driver-card__facts dt {
  color: var(--text-muted);
}

.driver-card__facts dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
}

@media (max-width: 560px) {
  .driver-modal-backdrop {
    padding: 16px;
  }

  .driver-card {
    grid-template-columns: 1fr;
  }

  .driver-card__portrait-wrap,
  .driver-card__portrait,
  .driver-card__portrait-placeholder {
    min-height: 0;
    height: min(42svh, 300px);
  }

  .driver-card__info {
    padding: 24px;
  }

  .driver-card__team {
    margin-bottom: 18px;
  }
}
</style>
