<script setup lang="ts">
import brandLogo from '../../assets/img/Inumito.png'
import '../../styles/auth.css'
import type { AuthCardProps, AuthCardSlots } from '../../types/access-ui'

const props = defineProps<AuthCardProps>()
defineSlots<AuthCardSlots>()
</script>

<template>
  <section class="card border-0 shadow-lg auth-card" aria-labelledby="auth-card-title">
    <div class="card-body p-5 auth-card-body">
      <header class="text-center auth-header">
        <div class="mx-auto mb-4 text-center auth-logo">
          <div class="auth-brand" role="img" aria-label="PoligonoTiro">
            <img
              :src="brandLogo"
              alt=""
              class="auth-brand-logo"
              width="44"
              height="44"
            />
            <span class="auth-brand-text">PoligonoTiro</span>
          </div>
        </div>
        <h1 id="auth-card-title" class="fw-bold text-dark mb-2">{{ props.title }}</h1>
        <p v-if="props.description" class="text-muted auth-description">
          {{ props.description }}
        </p>
      </header>

      <div class="mt-4 auth-form-content">
        <slot />
      </div>
    </div>
  </section>
  <p v-if="$slots.footer" class="text-center mt-4 text-white text-opacity-50 auth-footer">
    <slot name="footer" />
  </p>
</template>
