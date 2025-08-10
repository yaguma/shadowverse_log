<script setup lang="ts">
import { ref } from 'vue'
import BattleLogList from '@/components/BattleLogList.vue'
import BattleLogDialog from '@/components/BattleLogDialog.vue'

const showDialog = ref(false)

function handleSubmit() {
  // Dialog will handle the submission and close itself
  // We might want to refresh the list here if needed
}
</script>

<template>
  <main>
    <BattleLogList @add="showDialog = true" />
    <BattleLogDialog 
      :is-open="showDialog" 
      @close="showDialog = false" 
      @submit="handleSubmit"
    />
  </main>
</template>
