<script setup lang="ts">
import { computed } from 'vue'

interface LessonSummary {
  fracciones?: number | null
  tiradores_unicos?: number | null
  tiros_total?: number | null
  tiros_acertados_total?: number | null
}

type SummaryStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'error'

type StatIconTone = 'primary' | 'success' | 'info' | 'warning'

interface StatMetricView {
  label: string
  value: string
  icon: string
  tone: StatIconTone
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

function formatCount(value: unknown): string {
  const count = validCount(value)
  return count === null ? '—' : new Intl.NumberFormat('es-CL').format(count)
}

const metrics = computed<StatMetricView[]>(() => [
  {
    label: 'Fracciones',
    value: formatCount(props.summary?.fracciones),
    icon: 'ph:chart-bar',
    tone: 'primary',
  },
  {
    label: 'Tiradores únicos',
    value: formatCount(props.summary?.tiradores_unicos),
    icon: 'ph:users-three',
    tone: 'success',
  },
  {
    label: 'Disparos registrados',
    value: formatCount(props.summary?.tiros_total),
    icon: 'ph:table',
    tone: 'info',
  },
  {
    label: 'Aciertos registrados',
    value: formatCount(props.summary?.tiros_acertados_total),
    icon: 'ph:checks',
    tone: 'warning',
  },
])

// Las cuatro tarjetas se conservan por decisión del operador: la proporción de
// aciertos es otra lectura, no un sustituto de estos conteos.

// Cada estado del área se lee distinto. Los conteos del backend (incluidos los
// ceros reales) siguen su curso: aquí sólo se nombra el estado.
const stateNote = computed<string | null>(() => {
  if (props.status === 'loading') return 'Consultando el resumen de la lección…'
  if (props.status === 'denied') return 'La sesión no acredita la lectura de este resumen.'
  if (props.status === 'error') return 'No se pudo consultar el resumen.'
  if (props.status === 'empty') return 'La lección no tiene resultados de tiro registrados.'
  if (props.status === 'idle') return 'Aún no se consultó el resumen.'
  return null
})
</script>

<template>
  <div class="stat-block">
    <p v-if="stateNote" class="stat-note" role="status">{{ stateNote }}</p>
    <div class="stat-grid" :aria-busy="status === 'loading'">
      <article v-for="metric in metrics" :key="metric.label" class="card stat-card">
        <div class="card-body">
          <div class="stat-content">
            <div class="stat-text">
              <div class="stat-label">{{ metric.label }}</div>
              <div class="stat-value">{{ metric.value }}</div>
            </div>
            <div class="stat-icon" :class="`stat-icon--${metric.tone}`" aria-hidden="true">
              <iconify-icon :icon="metric.icon"></iconify-icon>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
