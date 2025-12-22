<template>
  <div class="httplist-operation">
    <el-tooltip :content="stoped ? t('common.start') : t('common.pause')">
      <el-icon :size="24" @click="changeStoped" style="cursor: pointer; margin-right: 16px;">
        <VideoPlay v-if="stoped" />
        <VideoPause v-else />
      </el-icon>
    </el-tooltip>
    <el-tooltip :content="t('httpList.importHar')">
      <el-icon :size="24" @click="triggerFileInput" style="cursor: pointer; margin-right: 16px;">
        <Upload />
      </el-icon>
    </el-tooltip>
    <el-tooltip :content="t('common.clear')">
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
import { useI18n } from '../../../composables/useI18n';

const globalStore = useGlobalStore();
const { httpListConfig } = storeToRefs(globalStore);
const { t } = useI18n();

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
    ElMessage.success(t('httpList.importSuccess').replace('{count}', String(httpPackages.length)));
    
    // Reset file input
    target.value = '';
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('httpList.importFail'));
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
