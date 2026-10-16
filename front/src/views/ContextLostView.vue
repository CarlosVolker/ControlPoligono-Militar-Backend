<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useSessionStore } from '../stores/session'
import '../styles/access-forms.css'

const router = useRouter()
const session = useSessionStore()

async function logout(): Promise<void> {
  if (session.logoutBusy) return
  const closing = session.logout()
  await router.replace('/login')
  await closing
}
</script>

<template>
  <section class="page-head">
    <div>
      <h1 class="page-title">Contexto perdido</h1>
      <p class="page-subtitle">El contexto recibido ya no permite continuar.</p>
    </div>
  </section>

  <article class="card">
    <div class="card-head">
      <h2 class="card-title">La institución activa ya no está disponible</h2>
    </div>
    <div class="card-body">
      <div class="alert alert-warning" role="status">
        La institución con la que estabas trabajando dejó de estar disponible en el contexto. Elige otra institución para continuar, o cierra la sesión.
      </div>
      <div class="context-lost-actions">
        <RouterLink class="btn btn-primary" to="/contexto">Elegir institución</RouterLink>
        <button
          class="btn btn-secondary"
          type="button"
          :disabled="session.logoutBusy"
          :aria-busy="session.logoutBusy"
          @click="logout"
        >
          {{ session.logoutBusy ? 'Cerrando sesión…' : 'Cerrar sesión' }}
        </button>
      </div>
    </div>
  </article>
</template>
