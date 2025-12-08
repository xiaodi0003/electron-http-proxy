<template>
  <div class="dynamicproxy-operation">
    <el-tooltip content="导出配置">
      <el-icon :size="24" @click="handleExport" style="cursor: pointer; margin-right: 16px;">
        <Download />
      </el-icon>
    </el-tooltip>
    <el-tooltip content="导入配置">
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
import { useGlobalStore, type ProxySetting } from '../../../stores/global';
import { getProxySettings, addProxySetting, deleteProxySetting } from '../../../api/dynamicProxy';

const globalStore = useGlobalStore();
const { proxySettings } = storeToRefs(globalStore);

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
    ElMessage.success('配置导出成功');
  } catch (error) {
    ElMessage.error('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
      throw new Error('配置文件格式错误');
    }
    
    // Confirm before importing
    await ElMessageBox.confirm(
      `确定要导入 ${importedSettings.length} 条配置吗？这将替换当前所有配置。`,
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
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
    ElMessage.success('配置导入成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导入失败: ' + (error instanceof Error ? error.message : '未知错误'));
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
