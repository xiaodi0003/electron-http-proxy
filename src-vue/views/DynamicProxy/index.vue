<template>
  <div>
    <el-table
      :data="proxySettings"
      row-key="id"
      :row-class-name="getRowClassName"
      class="dynamicproxy"
      height="calc(100vh - 180px)"
      style="width: 100%"
    >
      <el-table-column prop="type" label="匹配方式" width="100" />
      <el-table-column prop="from" label="From" min-width="200" />
      <el-table-column prop="to" label="To" min-width="200" />
      <el-table-column label="操作" width="320" class-name="operations">
        <template #default="{ row }">
          <div style="white-space: nowrap;">
            <el-button link type="primary" @click="editSetting(row)">Edit</el-button>
            <el-button link type="danger" @click="handleDelete(row)">Delete</el-button>
            <el-button link type="primary" @click="copySetting(row)">Copy</el-button>
            <el-button link type="primary" @click="toggleEnabled(row)">
              {{ row.enabled ? 'Disable' : 'Enable' }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div style="padding: 16px;">
      <el-button type="primary" @click="addSetting">Add</el-button>
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
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useGlobalStore, type ProxySetting, DEFAULT_BACKEND_PROXY } from '../../stores/global';
import { getProxySettings, updateProxySetting, addProxySetting, deleteProxySetting } from '../../api/dynamicProxy';
import SettingDetail from './components/SettingDetail.vue';

const globalStore = useGlobalStore();
const { proxySettings } = storeToRefs(globalStore);

const nowSetting = ref<ProxySetting | null>(null);

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

onMounted(() => {
  getProxySettings();
});
</script>

<style>
.dynamicproxy .disabled {
  opacity: 0.5;
}

.operations .el-button+.el-button {
  margin-left: 5px;
}
</style>
