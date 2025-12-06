<template>
  <div style="display: flex; flex-direction: column; height: calc(100vh - 64px);">
    <div style="flex: 1; overflow: auto;">
      <el-table
        :data="whitelistItems"
        row-key="id"
        :row-class-name="getRowClassName"
        class="whitelist"
        height="calc(100vh - 320px)"
        style="width: 100%"
      >
        <el-table-column prop="domain" label="域名" min-width="300">
          <template #default="{ row }">
            <span>{{ row.domain }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button link type="primary" @click="editItem(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
              <el-button link type="primary" @click="toggleEnabled(row)">
                {{ row.enabled ? '禁用' : '启用' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="padding: 16px;">
        <el-button type="primary" @click="addItem">添加</el-button>
      </div>
    </div>

    <div style="border-top: 1px solid #e8e8e8; padding: 16px; background: #fafafa; max-height: 200px; overflow-y: auto;">
      <div style="font-weight: 600; margin-bottom: 8px; color: #606266;">
        系统当前白名单 (每5秒自动刷新)
      </div>
      <div v-if="Object.keys(systemProxyBypass).length === 0" style="color: #909399; font-size: 14px;">
        暂无系统白名单
      </div>
      <div v-else>
        <div v-for="(domains, service) in systemProxyBypass" :key="service" style="margin-bottom: 12px;">
          <div style="font-weight: 500; color: #409eff; margin-bottom: 4px;">{{ service }}</div>
          <div style="padding-left: 16px;">
            <el-tag
              v-for="(domain, index) in domains"
              :key="index"
              size="small"
              style="margin-right: 8px; margin-bottom: 4px;"
            >
              {{ domain }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <WhitelistDialog
      v-if="nowItem"
      :item="nowItem"
      @ok="handleSave"
      @cancel="nowItem = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useGlobalStore, type WhitelistItem } from '../../stores/global';
import { getWhitelist, updateWhitelistItem, addWhitelistItem, deleteWhitelistItem, getSystemProxyBypass } from '../../api/whitelist';
import WhitelistDialog from './components/WhitelistDialog.vue';

const globalStore = useGlobalStore();
const { whitelistItems, systemProxyBypass } = storeToRefs(globalStore);

const nowItem = ref<WhitelistItem | null>(null);
let refreshTimer: number | null = null;

const getRowClassName = ({ row }: { row: WhitelistItem }) => {
  return row.enabled ? '' : 'disabled';
};

const editItem = (item: WhitelistItem) => {
  nowItem.value = { ...item };
};

const addItem = () => {
  nowItem.value = {
    enabled: true,
    domain: '',
  };
};

const toggleEnabled = (item: WhitelistItem) => {
  handleSave({ ...item, enabled: !item.enabled });
};

const handleDelete = (item: WhitelistItem) => {
  deleteWhitelistItem(item);
};

const handleSave = (item: WhitelistItem) => {
  if (item) {
    if (item.id) {
      updateWhitelistItem(item);
    } else {
      addWhitelistItem(item);
    }
  }
  nowItem.value = null;
};

onMounted(() => {
  getWhitelist();
  getSystemProxyBypass();
  
  // Refresh system proxy bypass every 5 seconds
  refreshTimer = window.setInterval(() => {
    getSystemProxyBypass();
  }, 5000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style>
.whitelist .disabled {
  opacity: 0.5;
}
</style>
