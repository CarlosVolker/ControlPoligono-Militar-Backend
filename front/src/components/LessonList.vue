<script setup lang="ts">
import { computed } from 'vue'
import StateMessage from './StateMessage.vue'

interface LessonRecord {
  id_leccion: number | string
  fecha_tiro?: string | null
  numero_orden?: number | string | null
  tipo_tiro?: string | null
  id_poligono?: number | string | null
}

interface LessonPolygon {
  nombre?: string | null
  nombre_poligono?: string | null
  name?: string | null
}

type PolygonLookup = Record<string | number, LessonPolygon | undefined>

type LessonListStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'denied' | 'error'

interface StateMessageView {
  title: string
  message: string
  tone: 'info' | 'warning' | 'danger'
  actionLabel?: string
}

const props = withDefaults(
  defineProps<{
    lessons?: LessonRecord[]
    polygonsById?: PolygonLookup
    selectedLessonId?: number | string | null
    status?: LessonListStatus
    error?: string | Record<string, unknown> | null
  }>(),
  {
    lessons: () => [],
    polygonsById: () => ({}),
    selectedLessonId: null,
    status: 'idle',
    error: null,
  },
)

const emit = defineEmits<{
  select: [lessonId: LessonRecord['id_leccion']]
  retry: []
}>()

const hasLessons = computed(() => props.status === 'ready' && props.lessons.length > 0)

const message = computed<StateMessageView>(() => {
  if (props.status === 'loading') {
    return {
      title: 'Cargando lecciones',
      message: 'Consultando las lecciones disponibles para este contexto.',
      tone: 'info',
    }
  }

  if (props.status === 'denied') {
    return {
      title: 'Lecciones no autorizadas',
      message: 'El backend no autorizó la consulta de lecciones.',
      tone: 'warning',
    }
  }

  if (props.status === 'error') {
    return {
      title: 'No se pudieron cargar las lecciones',
      message: typeof props.error === 'string' && props.error.trim()
        ? props.error
        : 'La consulta de lecciones falló.',
      tone: 'danger',
      actionLabel: 'Reconsultar',
    }
  }

  if (props.status === 'empty' || (props.status === 'ready' && props.lessons.length === 0)) {
    return {
      title: 'Sin lecciones disponibles',
      message: 'El backend no devolvió lecciones para este contexto.',
      tone: 'info',
    }
  }

  return {
    title: 'Lecciones sin cargar',
    message: 'Aplica un código de institución para consultar lecciones reales.',
    tone: 'info',
  }
})

function formatDate(value: LessonRecord['fecha_tiro']): string {
  if (typeof value !== 'string' || !value.trim()) return '—'

  const source = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value
  const date = new Date(source)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

function displayValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

function displayType(value: LessonRecord['tipo_tiro']): string {
  if (value === 'evaluacion') return 'Evaluación'
  if (value === 'entrenamiento') return 'Entrenamiento'
  return displayValue(value)
}

function polygonLabel(polygonId: LessonRecord['id_poligono']): string {
  if (polygonId === null || polygonId === undefined || polygonId === '') return '—'

  const polygon = props.polygonsById?.[polygonId]
  const name = polygon?.nombre ?? polygon?.nombre_poligono ?? polygon?.name
  if (typeof name === 'string' && name.trim()) return name.trim()

  return `ID de polígono #${polygonId}`
}
</script>

<template>
  <article class="card lesson-card">
    <div class="card-head">
      <div>
        <h2 id="lessons-title" class="card-title">Lecciones</h2>
        <p class="card-subtitle">Selecciona una lección para consultar su resumen.</p>
      </div>
    </div>

    <div v-if="hasLessons" class="card-body no-pad">
      <div class="lesson-table-wrap" role="region" aria-label="Tabla de lecciones" tabindex="0">
        <table class="data-table lesson-table">
          <caption class="visually-hidden">Lecciones disponibles para el contexto consultado</caption>
          <thead>
            <tr>
              <th scope="col">Lección</th>
              <th scope="col">Fecha de tiro</th>
              <th scope="col">Número de orden</th>
              <th scope="col">Tipo de tiro</th>
              <th scope="col">Polígono</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="lesson in lessons"
              :key="lesson.id_leccion"
              :class="{ 'is-selected': String(selectedLessonId) === String(lesson.id_leccion) }"
            >
              <td>
                <button
                  class="lesson-select"
                  type="button"
                  :aria-label="`Seleccionar lección #${lesson.id_leccion}`"
                  :aria-pressed="String(selectedLessonId) === String(lesson.id_leccion)"
                  @click="emit('select', lesson.id_leccion)"
                >
                  #{{ displayValue(lesson.id_leccion) }}
                </button>
              </td>
              <td>{{ formatDate(lesson.fecha_tiro) }}</td>
              <td>{{ displayValue(lesson.numero_orden) }}</td>
              <td>{{ displayType(lesson.tipo_tiro) }}</td>
              <td>{{ polygonLabel(lesson.id_poligono) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="card-body">
      <StateMessage
        :title="message.title"
        :message="message.message"
        :tone="message.tone"
        :action-label="message.actionLabel"
        @action="emit('retry')"
      />
    </div>
  </article>
</template>
