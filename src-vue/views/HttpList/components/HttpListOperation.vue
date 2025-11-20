<template>
  <div class="httplist-operation">
    <el-tooltip :content="stoped ? '启动' : '暂停'">
      <el-icon :size="24" @click="changeStoped" style="cursor: pointer; margin-right: 16px;">
        <VideoPlay v-if="stoped" />
        <VideoPause v-else />
      </el-icon>
    </el-tooltip>
    <el-tooltip content="清空">
      <el-icon :size="24" @click="clear" style="cursor: pointer;">
        <Delete />
      </el-icon>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useGlobalStore } from '../../../stores/global';
import { VideoPlay, VideoPause, Delete } from '@element-plus/icons-vue';

const globalStore = useGlobalStore();
const { httpListConfig } = storeToRefs(globalStore);

const stoped = computed(() => httpListConfig.value.stoped);

const changeStoped = () => {
  globalStore.httpListConfigChange({ stoped: !stoped.value });
};

const clear = () => {
  globalStore.httpPackageClear();
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
