import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/design-system.css'
import './styles/dashboard.css'
import './styles/theme-customizer.css'
import { registerPreviewIconCollections } from './features/appearance/preview-assets'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
registerPreviewIconCollections()
app.mount('#app')
