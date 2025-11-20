<template>
  <el-dropdown @command="handleCommand">
    <span class="lang-selector">
      <el-icon><Location /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN">
          <span>🇨🇳 简体中文</span>
        </el-dropdown-item>
        <el-dropdown-item command="en-US">
          <span>🇺🇸 English</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { Location } from '@element-plus/icons-vue';
import { useI18n } from '../composables/useI18n';

const { setLocale } = useI18n();

const handleCommand = (locale: string) => {
  setLocale(locale);
};
</script>

<style scoped>
.lang-selector {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 12px;
}

.lang-selector:hover {
  background: rgba(0, 0, 0, 0.025);
}
</style>
