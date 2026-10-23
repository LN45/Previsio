import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { listenForInstallPrompt } from './lib/install'
import './style.css'

listenForInstallPrompt()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
