<template>
  <div class="backend-proxy-config">
    <el-form-item label="后端代理类型" prop="backendProxy.type">
      <el-radio-group v-model="localConfig.type" @change="handleTypeChange">
        <el-radio label="direct">直接连接</el-radio>
        <el-radio label="http">HTTP</el-radio>
        <el-radio label="socks5">SOCKS5</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item 
      label="代理服务器" 
      prop="backendProxy.host"
      v-if="localConfig.type !== 'direct'"
    >
      <div style="display: flex; gap: 10px; width: 100%;">
        <el-input
          v-model="localConfig.host"
          :disabled="localConfig.type === 'direct'"
          placeholder="例如: 127.0.0.1 或 proxy.example.com"
          @input="handleChange"
          style="flex: 1;"
        />
        <el-input
          v-model="localConfig.port"
          :disabled="localConfig.type === 'direct'"
          placeholder="端口"
          @input="handlePortChange"
          @blur="validatePort"
          style="width: 120px;"
        />
      </div>
      <div v-if="portError" style="color: #f56c6c; font-size: 12px; margin-top: 5px;">
        {{ portError }}
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref } from 'vue';
import type { BackendProxyConfig } from '../../../stores/global';
import { DEFAULT_BACKEND_PROXY } from '../../../stores/global';

const props = defineProps<{
  modelValue: BackendProxyConfig;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: BackendProxyConfig];
}>();

// Create local reactive copy of the config
const localConfig = reactive<BackendProxyConfig>({
  type: props.modelValue?.type || DEFAULT_BACKEND_PROXY.type,
  host: props.modelValue?.host || '',
  port: props.modelValue?.port || 8080,
});

const portError = ref<string>('');

// Validate port number
const validatePort = () => {
  portError.value = '';
  if (localConfig.type === 'direct') {
    return;
  }
  
  const port = localConfig.port;
  if (!port) {
    portError.value = '端口号不能为空';
    return;
  }
  
  const portNum = Number(port);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    portError.value = '端口号必须在 1-65535 之间';
    return;
  }
};

// Handle port input change
const handlePortChange = () => {
  validatePort();
  if (!portError.value) {
    emitChange();
  }
};

// Handle proxy type change
const handleTypeChange = () => {
  portError.value = '';
  // When switching to direct, clear host and port
  if (localConfig.type === 'direct') {
    localConfig.host = '';
    localConfig.port = undefined;
  } else if (!localConfig.port) {
    // Set default port when switching to http or socks5
    // localConfig.port = localConfig.type === 'http' ? 8080 : 1080;
  }
  
  emitChange();
};

// Handle input change
const handleChange = () => {
  emitChange();
};

// Emit change to parent
const emitChange = () => {
  const config: BackendProxyConfig = {
    type: localConfig.type,
  };
  
  // Only include host and port for non-direct connections
  if (localConfig.type !== 'direct') {
    config.host = localConfig.host;
    config.port = localConfig.port;
  }
  
  emit('update:modelValue', config);
};

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localConfig.type = newValue.type || DEFAULT_BACKEND_PROXY.type;
    localConfig.host = newValue.host || '';
    // localConfig.port = newValue.port || (newValue.type === 'http' ? 8080 : 1080);
  }
}, { deep: true });
</script>

<style scoped>
.backend-proxy-config {
  padding-left: 20px;
  border-left: 2px solid #e4e7ed;
  margin-top: 10px;
}
</style>
