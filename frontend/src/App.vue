<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>シャドウバース対戦履歴管理</h1>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #1e293b;
  color: white;
  padding: 1rem 0;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.app-main {
  flex: 1;
  background-color: #f8fafc;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .app-header h1 {
    font-size: 1.25rem;
  }
  
  .app-main {
    padding: 1rem 0;
  }
}
</style>
