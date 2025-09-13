<template>
  <button class="theme-toggle" @click="toggleTheme" :aria-label="`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`">
    <transition name="fade" mode="out-in">
      <svg v-if="theme === 'light'" key="sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19.3 16.9c.4-.7.7-1.5.7-2.4c0-2.5-2-4.5-4.5-4.5S11 12 11 14.5s2 4.5 4.5 4.5c.9 0 1.7-.3 2.4-.7l3.2 3.2l1.4-1.4l-3.2-3.2zM15.5 17c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5zM12 4V2h-2v2h2zm0 18v-2h-2v2h2zm-9-9H1v-2h2v2zm18 0h-2v-2h2v2zM6.1 6.1L4.7 4.7L3.3 6.1l1.4 1.4l1.4-1.4zm11.8 11.8l-1.4 1.4l1.4 1.4l1.4-1.4l-1.4-1.4zm-11.8 0l1.4-1.4l-1.4-1.4l-1.4 1.4l1.4 1.4zm11.8-11.8l-1.4-1.4l-1.4 1.4l1.4 1.4l1.4-1.4z"/></svg>
      <svg v-else key="moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0 9 9a9 9 0 0 1-9 9A9 9 0 0 1 3 12a9 9 0 0 0 9-9Z"/></svg>
    </transition>
  </button>
</template>

<script setup>
import { useTheme } from '@/composables/useTheme';
const { theme, toggleTheme } = useTheme();
</script>

<style scoped>
.theme-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background-color 0.2s ease, color 0.2s ease;
}
.theme-toggle:hover {
  color: var(--text-primary);
  background-color: var(--border-color);
}
.theme-toggle svg {
  width: 22px; /* Sedikit disesuaikan agar pas */
  height: 22px;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>