<template>
  <div class="httplist-operation">
    <el-tooltip :content="stoped ? '启动' : '暂停'">
      <el-icon :size="24" @click="changeStoped" style="cursor: pointer; margin-right: 16px;">
        <VideoPlay v-if="stoped" />
        <VideoPause v-else />
      </el-icon>
    </el-tooltip>
    <el-tooltip content="导入HAR">
      <el-icon :size="24" @click="triggerFileInput" style="cursor: pointer; margin-right: 16px;">
        <Upload />
      </el-icon>
    </el-tooltip>
    <el-tooltip content="清空">
      <el-icon :size="24" @click="clear" style="cursor: pointer;">
        <Delete />
      </el-icon>
    </el-tooltip>
    <input
      ref="fileInputRef"
      type="file"
      accept=".har"
      style="display: none;"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { useGlobalStore } from '../../../stores/global';
import { VideoPlay, VideoPause, Delete, Upload } from '@element-plus/icons-vue';
import { parseHarFile } from '../../../utils/harParser';

const globalStore = useGlobalStore();
const { httpListConfig } = storeToRefs(globalStore);

const stoped = computed(() => httpListConfig.value.stoped);
const fileInputRef = ref<HTMLInputElement | null>(null);

const changeStoped = () => {
  globalStore.httpListConfigChange({ stoped: !stoped.value });
};

const clear = () => {
  globalStore.httpPackageClear();
};

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const httpPackages = parseHarFile(content);
    
    globalStore.httpPackageImport(httpPackages);
    ElMessage.success(`成功导入 ${httpPackages.length} 条请求`);
    
    // Reset file input
    target.value = '';
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导入失败');
    target.value = '';
  }
};
</script>

<style scoped>
.httplist-operation {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
</style>
