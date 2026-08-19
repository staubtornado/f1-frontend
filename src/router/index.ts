import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Results from '../views/Results.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/results',
    name: 'Results',
    component: Results,
    props: route => ({
      season: route.query.season ? Number(route.query.season) : null,
      weekend: route.query.weekend ? Number(route.query.weekend) : null
    })
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
