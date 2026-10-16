<script setup lang="ts">
import { computed } from 'vue'

interface LessonSummary {
  tiros_total?: number | null
  tiros_acertados_total?: number | null
}

type SummaryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'error'

interface AccuracyState {
  hits: number
  shots: number
  fraction: number
}

const props = withDefaults(
  defineProps<{
    summary?: LessonSummary | null
    status?: SummaryStatus
  }>(),
  {
    summary: null,
    status: 'idle',
  },
)

function validCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null
}

const accuracy = computed<AccuracyState | null>(() => {
  if (!props.summary) return null

  const hits = validCount(props.summary.tiros_acertados_total)
  const shots = validCount(props.summary.tiros_total)
  if (hits === null || shots === null || hits > shots) return null

  return {
    hits,
    shots,
    fraction: shots === 0 ? 0 : hits / shots,
  }
})

const percentage = computed<string | null>(() => {
  const state = accuracy.value
  if (!state || state.shots === 0) return null

  return new Intl.NumberFormat('es-CL', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(state.fraction)
})

const progressValue = computed<number>(() => (
  accuracy.value ? Math.round(accuracy.value.fraction * 1000) / 10 : 0
))

const countLabel = computed<string>(() => {
  const state = accuracy.value
  if (!state) return '—'
  if (state.shots === 0) return 'Sin disparos registrados'

  const format = new Intl.NumberFormat('es-CL')
  return `${format.format(state.hits)} de ${format.format(state.shots)} disparos`
})
</script>

<template>
  <section class="card accuracy-card" aria-labelledby="accuracy-title" :aria-busy="status === 'loading'">
    <div class="card-body accuracy-body">
      <div class="accuracy-copy">
        <h3 id="accuracy-title" class="accuracy-title">Proporción de aciertos</h3>
        <p class="accuracy-count">{{ countLabel }}</p>
      </div>
      <strong class="accuracy-value">{{ percentage ?? '—' }}</strong>
      <div
        v-if="accuracy && accuracy.shots > 0"
        class="progress accuracy-progress"
        role="progressbar"
        aria-label="Proporción de aciertos"
        :aria-valuenow="progressValue"
        :aria-valuetext="`${percentage} · ${countLabel}`"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="progress-bar" :style="{ width: `${progressValue}%` }"></div>
      </div>
    </div>
  </section>
</template>
