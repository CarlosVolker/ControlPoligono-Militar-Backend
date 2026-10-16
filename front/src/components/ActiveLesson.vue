<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { ROUTE_NAMES } from '../router/routes'

interface LessonRecord {
  id_leccion?: number | string | null
  fecha_tiro?: string | null
  numero_orden?: number | string | null
  tipo_tiro?: string | null
  distancia?: number | string | null
  id_poligono?: number | string | null
}

interface LessonPolygon {
  nombre?: string | null
  nombre_poligono?: string | null
  name?: string | null
}

type PolygonLookup = Record<string | number, LessonPolygon | undefined>

const props = withDefaults(
  defineProps<{
    lesson?: LessonRecord | null
    polygonsById?: PolygonLookup
  }>(),
  {
    lesson: null,
    polygonsById: () => ({}),
  },
)

const lessonId = computed(() => props.lesson?.id_leccion ?? null)

const polygonLabel = computed<string>(() => {
  const polygonId = props.lesson?.id_poligono
  if (polygonId === null || polygonId === undefined || polygonId === '') return '—'

  const polygon = props.polygonsById?.[polygonId]
  const name = polygon?.nombre ?? polygon?.nombre_poligono ?? polygon?.name
  if (typeof name === 'string' && name.trim()) return name.trim()

  return `ID de polígono #${polygonId}`
})

function displayValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

// La distancia del dominio se expresa en metros; sin valor real, placeholder.
function formatDistance(value: LessonRecord['distancia']): string {
  const rendered = displayValue(value)
  return rendered === '—' ? rendered : `${rendered} m`
}

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
</script>

<template>
  <article class="card active-lesson-card" aria-labelledby="active-lesson-title">
    <div class="card-head active-lesson-head">
      <div>
        <p class="active-lesson-label">Lección seleccionada</p>
        <h2 id="active-lesson-title" class="card-title">
          {{ lessonId === null ? 'Ninguna lección seleccionada' : `Lección #${lessonId}` }}
        </h2>
      </div>
      <RouterLink
        v-if="lessonId !== null"
        class="btn btn-outline-primary"
        :to="{ name: ROUTE_NAMES.LESSON_DETAIL, params: { idLeccion: lessonId } }"
      >
        Ver lección en Tiro
      </RouterLink>
    </div>

    <div v-if="lesson" class="card-body active-lesson-body">
      <dl class="active-lesson-details">
        <div class="active-lesson-detail">
          <dt>Fecha de tiro</dt>
          <dd>{{ formatDate(lesson.fecha_tiro) }}</dd>
        </div>
        <div class="active-lesson-detail">
          <dt>Número de orden</dt>
          <dd>{{ displayValue(lesson.numero_orden) }}</dd>
        </div>
        <div class="active-lesson-detail">
          <dt>Tipo de tiro</dt>
          <dd>{{ displayValue(lesson.tipo_tiro) }}</dd>
        </div>
        <div class="active-lesson-detail">
          <dt>Distancia</dt>
          <dd>{{ formatDistance(lesson.distancia) }}</dd>
        </div>
        <div class="active-lesson-detail">
          <dt>Polígono</dt>
          <dd>{{ polygonLabel }}</dd>
        </div>
      </dl>
    </div>

    <div v-else class="card-body active-lesson-empty"></div>
  </article>
</template>
