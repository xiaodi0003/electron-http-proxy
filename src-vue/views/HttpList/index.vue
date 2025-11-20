<template>
  <div>
    <HttpListOperation />
    <div class="httptable">
      <table>
        <tbody>
          <tr>
            <th>序号</th>
            <th>Code</th>
            <th>Method</th>
            <th>协议</th>
            <th>Host</th>
            <th>Path</th>
            <th>Operation</th>
          </tr>
          <tr v-for="(data, i) in httpPackages" :key="data.id">
            <td>{{ i + 1 }}</td>
            <td>{{ data.res ? data.res.statusCode : '--' }}</td>
            <td>{{ data.req.method }}</td>
            <td>{{ getProtocol(data.req.url) }}</td>
            <td :title="getDomain(data.req.url)">{{ getDomain(data.req.url) }}</td>
            <td :title="getPath(data.req.url)">{{ getPath(data.req.url) }}</td>
            <td><a @click="showDetail(data)">Detail</a></td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <HttpPackageDetail
      v-if="detail"
      :detail="detail"
      @close="detail = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useGlobalStore } from '../../stores/global';
import { getDomain, getPath, getProtocol } from '../../utils/utils';
import HttpPackageDetail from './components/HttpPackageDetail.vue';
import HttpListOperation from './components/HttpListOperation.vue';
import type { HttpPackage } from '../../stores/global';

const globalStore = useGlobalStore();
const { httpPackages } = storeToRefs(globalStore);

const detail = ref<HttpPackage | null>(null);

const showDetail = (data: HttpPackage) => {
  detail.value = data;
};
</script>

<style scoped>
.httptable {
  height: calc(100vh - 120px);
  overflow: auto;
}

.httptable table {
  width: 100%;
  border-collapse: collapse;
}

.httptable th,
.httptable td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.httptable th {
  background-color: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 1;
}

.httptable td {
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.httptable a {
  color: #409eff;
  cursor: pointer;
}

.httptable a:hover {
  text-decoration: underline;
}
</style>
