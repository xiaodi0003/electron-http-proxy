<template>
  <el-input
    v-model="localValue"
    type="textarea"
    :rows="15"
    class="code-editor"
    @input="handleInput"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const localValue = ref(props.modelValue);

const handleInput = () => {
  emit('update:modelValue', localValue.value);
};

watch(() => props.modelValue, (newValue) => {
  if (localValue.value !== newValue) {
    localValue.value = newValue;
  }
});
</script>

<style scoped>
.code-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
}

:deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
}
</style>
