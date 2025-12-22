<template>
  <div class="dynamicproxy-operation">
    <el-tooltip :content="t('dynamicProxy.exportConfig')">
      <el-icon :size="24" @click="handleExport" style="cursor: pointer; margin-right: 16px;">
        <Download />
      </el-icon>
    </el-tooltip>
    <el-tooltip :content="t('dynamicProxy.importConfig')">
      <el-icon :size="24" @click="triggerFileInput" style="cursor: pointer;">
        <Upload />
      </el-icon>
    </el-tooltip>
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none;"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Upload } from '@element-plus/icons-vue';
import { useGlobalStore } from '../../../stores/global';
import { getProxySettings, addProxySetting, deleteProxySetting } from '../../../api/dynamicProxy';
import { useI18n } from '../../../composables/useI18n';

const globalStore = useGlobalStore();
const { proxySettings } = storeToRefs(globalStore);
const { t } = useI18n();

const fileInputRef = ref<HTMLInputElement | null>(null);

// Export proxy settings to JSON file
const handleExport = () => {
  try {
    // Remove id field for cleaner export
    const exportData = proxySettings.value.map(({ id, ...rest }) => rest);
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `proxy-settings-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success(t('dynamicProxy.exportSuccess'));
  } catch (error) {
    ElMessage.error(t('dynamicProxy.exportFail') + ': ' + (error instanceof Error ? error.message : t('dynamicProxy.unknownError')));
  }
};

// Trigger file input click
const triggerFileInput = () => {
  fileInputRef.value?.click();
};

// Handle file selection and import
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) {
    return;
  }
  
  try {
    const text = await file.text();
    const importedSettings = JSON.parse(text);
    
    if (!Array.isArray(importedSettings)) {
      throw new Error(t('dynamicProxy.configFormatError'));
    }
    
    // Confirm before importing
    await ElMessageBox.confirm(
      t('dynamicProxy.importConfirm').replace('{count}', String(importedSettings.length)),
      t('dynamicProxy.importConfirmTitle'),
      {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      }
    );
    
    // Clear existing settings and add imported ones
    for (const setting of proxySettings.value) {
      await deleteProxySetting(setting);
    }
    
    for (const setting of importedSettings) {
      await addProxySetting(setting);
    }
    
    await getProxySettings();
    ElMessage.success(t('dynamicProxy.importSuccess'));
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(t('dynamicProxy.importFail') + ': ' + (error instanceof Error ? error.message : t('dynamicProxy.unknownError')));
    }
  } finally {
    // Reset file input
    target.value = '';
  }
};
</script>

<style scoped>
.dynamicproxy-operation {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
</style>
