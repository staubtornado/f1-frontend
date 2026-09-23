<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getApiErrorMessage } from '../api/client'
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
let controller: AbortController | null = null

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
  controller?.abort()
  controller = null
  const currentRequest = ++requestId
  driver.value = null
  error.value = null
  portraitFailed.value = false

  if (!props.open || props.driverId === null) {
    loading.value = false
    return
  }

  const activeController = new AbortController()
  controller = activeController
  loading.value = true
  try {
    const loadedDriver = await getSeasonDriver(props.season, props.driverId, activeController.signal)
    if (currentRequest === requestId && !activeController.signal.aborted) driver.value = loadedDriver
  } catch (caughtError) {
    if (currentRequest === requestId && !activeController.signal.aborted) {
      error.value = getApiErrorMessage(caughtError, 'Fahrerinformationen konnten nicht geladen werden.')
    }
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => [props.open, props.season, props.driverId] as const, loadDriver, { immediate: true })

const closeOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) {
    event.stopImmediatePropagation()
    emit('close')
  }
}

if (typeof window !== 'undefined') window.addEventListener('keydown', closeOnEscape)
onBeforeUnmount(() => {
  controller?.abort()
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
            <div class="driver-card__portrait-glow" aria-hidden="true" />
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
            <p class="driver-card__number"><span>Fahrer</span>#{{ driver.driver_id }}</p>
          </div>

          <div class="driver-card__info">
            <div class="driver-card__topline">
              <p class="driver-card__eyebrow">Fahrerprofil</p>
              <span class="driver-card__season">Saison {{ season }}</span>
            </div>
            <h2 id="driver-modal-title" class="driver-card__name">{{ driver.full_name }}</h2>
            <p id="driver-modal-description" class="driver-card__team">
              <span class="driver-card__team-mark" aria-hidden="true" />
              {{ driver.team_name }}
            </p>

            <dl class="driver-card__facts">
              <div>
                <dt>Kürzel</dt>
                <dd>{{ driver.acronym }}</dd>
              </div>
              <div>
                <dt>Startnummer</dt>
                <dd>#{{ driver.driver_id }}</dd>
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
  width: min(820px, 100%);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 16px;
  background: linear-gradient(135deg, #252530 0%, #191920 100%);
  box-shadow: 0 30px 100px rgb(0 0 0 / 60%), 0 0 0 1px rgb(255 255 255 / 3%);
}

.driver-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 50%;
  background: rgb(15 15 20 / 74%);
  color: white;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.driver-modal__close:hover,
.driver-modal__close:focus-visible {
  border-color: var(--f1-red);
  background: var(--f1-red);
  outline: 2px solid var(--f1-red);
  outline-offset: 2px;
  transform: rotate(90deg);
}

.driver-modal__status {
  display: grid;
  min-height: 360px;
  margin: 0;
  padding: 56px 32px 32px;
  place-items: center;
  text-align: center;
  color: var(--text-muted);
}

.driver-modal__status--error {
  color: #ff8a84;
}

.driver-card {
  display: grid;
  grid-template-columns: minmax(250px, 0.85fr) minmax(0, 1.35fr);
}

.driver-card__portrait-wrap {
  position: relative;
  display: grid;
  min-height: 390px;
  place-items: center;
  padding: 48px 30px 58px;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(ellipse at 50% 38%, rgb(225 6 0 / 14%), transparent 56%),
    linear-gradient(150deg, #282832 0%, #18181f 75%);
}

.driver-card__portrait-wrap::before,
.driver-card__portrait-wrap::after {
  position: absolute;
  z-index: -1;
  content: '';
  pointer-events: none;
}

.driver-card__portrait-wrap::before {
  inset: 18px;
  border: 1px solid rgb(255 255 255 / 7%);
  border-radius: 12px;
}

.driver-card__portrait-wrap::after {
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: linear-gradient(180deg, var(--f1-red), rgb(225 6 0 / 10%));
}

.driver-card__portrait-glow {
  position: absolute;
  z-index: -1;
  top: 18%;
  left: 50%;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: rgb(225 6 0 / 12%);
  filter: blur(54px);
  transform: translateX(-50%);
}

.driver-card__portrait {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  height: auto;
  max-width: min(100%, 230px);
  max-height: 280px;
  border-radius: 8px;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 18px 24px rgb(0 0 0 / 35%));
}

.driver-card__portrait-placeholder {
  position: relative;
  z-index: 1;
  display: grid;
  width: min(100%, 210px);
  aspect-ratio: 4 / 5;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 10px;
  background: linear-gradient(155deg, rgb(255 255 255 / 7%), rgb(0 0 0 / 18%));
  color: rgb(255 255 255 / 44%);
  font-size: clamp(3rem, 10vw, 5rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-shadow: 0 10px 32px rgb(0 0 0 / 35%);
}

.driver-card__number {
  position: absolute;
  right: 30px;
  bottom: 22px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  color: rgb(255 255 255 / 92%);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.driver-card__number span {
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.driver-card__info {
  align-self: center;
  padding: 52px 52px 44px;
}

.driver-card__topline {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.driver-card__eyebrow {
  margin: 0;
  color: var(--f1-red);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.driver-card__season {
  padding: 4px 9px;
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 999px;
  background: rgb(255 255 255 / 4%);
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.driver-card__name {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.65rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.04;
  text-wrap: balance;
}

.driver-card__team {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 13px 0 34px;
  color: rgb(255 255 255 / 82%);
  font-size: 1rem;
  font-weight: 600;
}

.driver-card__team-mark {
  width: 4px;
  height: 19px;
  border-radius: 3px;
  background: var(--f1-red);
  box-shadow: 0 0 12px rgb(225 6 0 / 45%);
}

.driver-card__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.driver-card__facts > div {
  min-width: 0;
  padding: 13px 15px;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 8px;
  background: rgb(255 255 255 / 3%);
}

.driver-card__facts dt {
  color: var(--text-muted);
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.driver-card__facts dd {
  margin: 4px 0 0;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .driver-modal-backdrop {
    padding: 12px;
  }

  .driver-modal {
    max-height: calc(100svh - 24px);
    overflow-y: auto;
    border-radius: 13px;
  }

  .driver-card {
    grid-template-columns: 1fr;
  }

  .driver-card__portrait-wrap {
    min-height: 0;
    height: min(38svh, 250px);
    padding: 28px 22px 48px;
  }

  .driver-card__portrait {
    max-height: 190px;
  }

  .driver-card__portrait-placeholder {
    width: min(150px, 65%);
    aspect-ratio: 1;
    border-radius: 50%;
  }

  .driver-card__number {
    right: 22px;
    bottom: 13px;
    font-size: 1.1rem;
  }

  .driver-card__portrait-placeholder {
    font-size: 3.4rem;
  }

  .driver-card__info {
    padding: 28px 24px 24px;
  }

  .driver-card__topline {
    margin-bottom: 11px;
  }

  .driver-card__name {
    font-size: clamp(1.7rem, 8vw, 2.15rem);
  }

  .driver-card__team {
    margin: 10px 0 22px;
  }

  .driver-card__facts {
    gap: 9px;
  }

  .driver-card__facts > div {
    padding: 11px 12px;
  }
}
</style>
