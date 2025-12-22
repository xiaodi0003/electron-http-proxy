<template>
  <div style="display: flex; flex-direction: column; height: calc(100vh - 64px);">
    <div style="flex: 1; overflow: auto;">
      <el-table
        :data="bypassListItems"
        row-key="id"
        :row-class-name="getRowClassName"
        class="bypasslist"
        height="calc(100vh - 320px)"
        style="width: 100%"
      >
        <el-table-column prop="domain" :label="t('bypassList.domain')" min-width="300">
          <template #default="{ row }">
            <span>{{ row.domain }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="250">
          <template #default="{ row }">
            <div style="white-space: nowrap;">
              <el-button link type="primary" @click="editItem(row)">{{ t('common.edit') }}</el-button>
              <el-button link type="danger" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
              <el-button link type="primary" @click="toggleEnabled(row)">
                {{ row.enabled ? t('common.disable') : t('common.enable') }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="padding: 16px;">
        <el-button type="primary" @click="addItem">{{ t('common.add') }}</el-button>
      </div>
    </div>

    <div style="border-top: 1px solid #e8e8e8; padding: 16px; background: #fafafa; max-height: 200px; overflow-y: auto;">
      <div style="font-weight: 600; margin-bottom: 8px; color: #606266;">
        {{ t('bypassList.systemProxyBypass') }}
      </div>
      <div v-if="Object.keys(systemProxyBypass).length === 0" style="color: #909399; font-size: 14px;">
        {{ t('bypassList.noSystemProxyBypass') }}
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

    <BypassListDialog
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
import { useGlobalStore, type BypassListItem } from '../../stores/global';
import { getBypassList, updateBypassListItem, addBypassListItem, deleteBypassListItem, getSystemProxyBypass } from '../../api/bypassList';
import { useI18n } from '../../composables/useI18n';
import BypassListDialog from './components/BypassListDialog.vue';

const globalStore = useGlobalStore();
const { bypassListItems, systemProxyBypass } = storeToRefs(globalStore);
const { t } = useI18n();

const nowItem = ref<BypassListItem | null>(null);
let refreshTimer: number | null = null;

const getRowClassName = ({ row }: { row: BypassListItem }) => {
  return row.enabled ? '' : 'disabled';
};

const editItem = (item: BypassListItem) => {
  nowItem.value = { ...item };
};

const addItem = () => {
  nowItem.value = {
    enabled: true,
    domain: '',
  };
};

const toggleEnabled = (item: BypassListItem) => {
  handleSave({ ...item, enabled: !item.enabled });
};

const handleDelete = (item: BypassListItem) => {
  deleteBypassListItem(item);
};

const handleSave = (item: BypassListItem) => {
  if (item) {
    if (item.id) {
      updateBypassListItem(item);
    } else {
      addBypassListItem(item);
    }
  }
  nowItem.value = null;
};

onMounted(() => {
  getBypassList();
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
.bypasslist .disabled {
  opacity: 0.5;
}
</style>
