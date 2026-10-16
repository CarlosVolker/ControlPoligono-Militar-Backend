<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { SESSION_STATUS } from '../types/session'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const session = useSessionStore()

// La vuelta atrás sólo existe si la navegación dejó una entrada previa en el
// historial del navegador (mismo origen que lee vue-router).
const canGoBack = Boolean(window.history.state?.back)

function goBack(): void {
  if (canGoBack) router.back()
}

const callToAction = computed(() => {
  if (session.status === SESSION_STATUS.ANONYMOUS) {
    return { to: '/login', label: 'Ir al inicio de sesión' }
  }
  if (session.status === SESSION_STATUS.CONTEXT_LOST) {
    return { to: '/contexto-perdido', label: 'Revisar el contexto' }
  }
  if (session.identity?.must_change_password) {
    return { to: '/password-required', label: 'Cambiar contraseña' }
  }
  if (session.status === SESSION_STATUS.NEEDS_TENANT || session.status === SESSION_STATUS.FAILURE) {
    return { to: '/contexto', label: 'Configurar contexto' }
  }
  return { to: '/', label: 'Volver al inicio' }
})
</script>

<template>
  <div class="error-container">
    <div class="error-row">
      <div class="error-col error-col-xl5">
        <div class="card error-card">
          <div class="error-body-alt">
            <div class="error-pad">
              <div class="error-inner text-center">
                <h1 class="error-code fs-60">404</h1>
                <h2 class="error-title fs-22">Página no encontrada</h2>
                <p class="error-text">La página a la que intentas acceder no está disponible.</p>
                <div class="error-actions">
                  <button v-if="canGoBack" type="button" class="btn btn-secondary" @click="goBack">
                    Volver a la página anterior
                  </button>
                  <RouterLink class="error-btn error-btn-danger" :to="callToAction.to">
                    {{ callToAction.label }}
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
</style>
