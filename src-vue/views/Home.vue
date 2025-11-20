<template>
  <div class="home">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 3 + TypeScript + Vite</p>
    <button @click="count++">点击次数: {{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('Hello Vue 3!')
const count = ref(0)
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

h1 {
  font-size: 3em;
  margin-bottom: 20px;
  color: #42b883;
}

p {
  font-size: 1.2em;
  margin-bottom: 30px;
  color: #666;
}

button {
  padding: 12px 24px;
  font-size: 1em;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #35a372;
}
</style>
