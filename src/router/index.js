// File: src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import BlogIndexView from '@/views/BlogIndexView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: BlogIndexView
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/CategoryIndexView.vue')
  },
  {
    path: '/category/:categorySlug',
    name: 'category',
    component: () => import('@/views/BlogIndexView.vue'),
    props: true
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue')
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/ContactView.vue')
  },
  {
    path: '/privacy-policy',
    name: 'privacy-policy',
    component: () => import('@/views/PrivacyPolicyView.vue')
  },
  {
    path: '/terms-of-service',
    name: 'terms-of-service',
    component: () => import('@/views/TermsOfServiceView.vue')
  },
  {
    path: '/:slug',
    name: 'post',
    component: () => import('@/views/ArticleView.vue'),
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // --- TAMBAHKAN BLOK KODE INI UNTUK MEMPERBAIKI MASALAH SCROLL ---
  scrollBehavior(to, from, savedPosition) {
    // Selalu gulir ke atas halaman saat navigasi baru
    return { top: 0 }
  }
  // -----------------------------------------------------------
})

export default router