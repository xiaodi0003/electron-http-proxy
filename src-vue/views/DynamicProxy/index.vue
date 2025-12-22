<template>
  <div>
    <DynamicProxyOperation />
    
    <el-table
      ref="tableRef"
      :data="proxySettings"
      row-key="id"
      :row-class-name="getRowClassName"
      class="dynamicproxy"
      height="calc(100vh - 180px)"
      style="width: 100%"
    >
      <el-table-column :label="t('common.drag')" width="60" class-name="drag-handle">
        <template #default>
          <el-icon class="drag-icon" style="cursor: move;">
            <Rank />
          </el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="type" :label="t('dynamicProxy.matchType')" width="100" />
      <el-table-column prop="from" label="From" min-width="200" />
      <el-table-column prop="to" label="To" min-width="200" />
      <el-table-column :label="t('common.operation')" width="350" class-name="operations">
        <template #default="{ row, $index }">
          <div style="white-space: nowrap;">
            <el-button link type="primary" @click="moveUp(row, $index)" :disabled="$index === 0">{{ t('common.moveUp') }}</el-button>
            <el-button link type="primary" @click="moveDown(row, $index)" :disabled="$index === proxySettings.length - 1">{{ t('common.moveDown') }}</el-button>
            <el-button link type="primary" @click="editSetting(row)">{{ t('common.edit') }}</el-button>
            <el-button link type="danger" @click="handleDelete(row)">{{ t('common.delete') }}</el-button>
            <el-button link type="primary" @click="copySetting(row)">{{ t('common.copy') }}</el-button>
            <el-button link type="primary" @click="toggleEnabled(row)">
              {{ row.enabled ? t('common.disable') : t('common.enable') }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div style="padding: 16px;">
      <el-button type="primary" @click="addSetting">{{ t('common.add') }}</el-button>
    </div>

    <SettingDetail
      v-if="nowSetting"
      :setting="nowSetting"
      @ok="handleSave"
      @cancel="nowSetting = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { Rank } from '@element-plus/icons-vue';
import Sortable from 'sortablejs';
import { useGlobalStore, type ProxySetting, DEFAULT_BACKEND_PROXY } from '../../stores/global';
import { getProxySettings, updateProxySetting, addProxySetting, deleteProxySetting, moveProxySetting } from '../../api/dynamicProxy';
import { useI18n } from '../../composables/useI18n';
import SettingDetail from './components/SettingDetail.vue';
import DynamicProxyOperation from './components/DynamicProxyOperation.vue';

const globalStore = useGlobalStore();
const { proxySettings } = storeToRefs(globalStore);
const { t } = useI18n();

const nowSetting = ref<ProxySetting | null>(null);
const tableRef = ref();
let sortableInstance: Sortable | null = null;

const getRowClassName = ({ row }: { row: ProxySetting }) => {
  return row.enabled ? '' : 'disabled';
};

const editSetting = (setting: ProxySetting) => {
  nowSetting.value = { ...setting };
};

const copySetting = (setting: ProxySetting) => {
  const copied = { ...setting };
  delete copied.id;
  nowSetting.value = copied;
};

const addSetting = () => {
  nowSetting.value = {
    enabled: true,
    type: 'exact',
    from: 'http://',
    to: 'http://',
    reqHook: false,
    reqHookCode: '',
    resHook: false,
    resHookCode: '',
    delay: 0,
    backendProxy: { ...DEFAULT_BACKEND_PROXY },
  };
};

const toggleEnabled = (setting: ProxySetting) => {
  handleSave({ ...setting, enabled: !setting.enabled });
};

const handleDelete = (setting: ProxySetting) => {
  deleteProxySetting(setting);
};

const handleSave = (setting: ProxySetting) => {
  if (setting) {
    if (setting.id) {
      updateProxySetting(setting);
    } else {
      addProxySetting(setting);
    }
  }
  nowSetting.value = null;
};

const moveUp = (setting: ProxySetting, index: number) => {
  if (index > 0) {
    moveProxySetting(setting, 'up');
  }
};

const moveDown = (setting: ProxySetting, index: number) => {
  if (index < proxySettings.value.length - 1) {
    moveProxySetting(setting, 'down');
  }
};

const initSortable = () => {
  nextTick(() => {
    const tbody = tableRef.value?.$el.querySelector('.el-table__body-wrapper tbody');
    if (!tbody) return;

    sortableInstance?.destroy();
    sortableInstance = Sortable.create(tbody, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      onEnd: ({ oldIndex, newIndex }) => {
        if (oldIndex !== newIndex && oldIndex !== undefined && newIndex !== undefined) {
          const setting = proxySettings.value[oldIndex];
          const direction = oldIndex < newIndex ? 'down' : 'up';
          for (let i = 0; i < Math.abs(newIndex - oldIndex); i++) {
            moveProxySetting(setting, direction);
          }
        }
      },
    });
  });
};

watch(() => proxySettings.value.length, initSortable);

onMounted(() => {
  getProxySettings();
  initSortable();
});
</script>

<style>
.dynamicproxy .disabled {
  opacity: 0.5;
}

.operations .el-button+.el-button {
  margin-left: 5px;
}

.drag-handle {
  cursor: move;
}

.drag-icon {
  font-size: 18px;
  color: #909399;
}

.drag-icon:hover {
  color: #409eff;
}

.sortable-ghost {
  opacity: 0.4;
  background: #f0f9ff;
}
</style>
