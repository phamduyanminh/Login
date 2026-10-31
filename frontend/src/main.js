import { createApp } from 'vue'
import router from './router.js'
import App from './views/views/App.vue'

createApp(App).use(router).mount('#app')
