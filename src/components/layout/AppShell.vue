<script setup lang="ts">
import { onMounted, ref } from 'vue' // Vue reactivity APIs
import { getSeasons } from '../../api/endpoints/seasons'

const message = 'Hello from AppShell'
const seasons = ref<number[]>([])
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    seasons.value = await getSeasons()
  } catch {
    error.value = 'Backend unreachable'
  }
})
</script>

<template>
  <h1>Shell</h1>
  <p>{{ message }}</p>
  <p v-if="error">{{ error }}</p>
  <p v-else>{{ seasons.join(', ') || 'Laden…' }}</p>
</template>