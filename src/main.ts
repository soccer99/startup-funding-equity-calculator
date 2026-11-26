import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import App from './App.vue'
import { setSharedScenario } from './composables/useEquityCalculator'
import { decodeScenario } from './lib/share'
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
// Read a share link first, so the app starts with its scenario.
decodeScenario(location.hash).then(scenario => {
  setSharedScenario(scenario)
  app.mount('#app')
})
