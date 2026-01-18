import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import App from './App.vue'
import './style.css'
import 'floating-vue/dist/style.css'

const app = createApp(App)
app.use(FloatingVue, {
  themes: {
    'info-tooltip': {
      $extend: 'dropdown',
      $resetCss: true,
    },
  },
})
app.mount('#app')
