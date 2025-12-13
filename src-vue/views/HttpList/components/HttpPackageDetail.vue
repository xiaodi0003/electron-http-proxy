<template>
  <el-dialog
    v-model="visible"
    :title="detail?.req.url"
    width="80%"
    class="httpdetail"
    @close="handleClose"
  >
    <div v-if="detail?.req">
      <h3>{{ t('httpList.request') }}</h3>
      <el-tabs>
        <el-tab-pane :label="t('httpList.request')">
          <div class="httprequest">
            {{ `${detail.req.method} ${getPath(detail.req.url)} HTTP/${detail.req.httpVersion}` }}
          </div>
        </el-tab-pane>
        <el-tab-pane :label="t('httpList.header')">
          <div class="httpheader">
            <div v-for="[key, value] in Object.entries(detail.req.headers || {})" :key="key">
              <span>{{ key }}:</span>
              <span>{{ value }}</span>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="!isGet" :label="t('httpList.body')">
          <pre class="httpbody">{{ getBodyStr(detail.req) }}</pre>
        </el-tab-pane>
        <el-tab-pane v-if="!isGet && isJson(detail.req)" :label="t('httpList.jsonBody')">
          <div class="httpbody">
            <pre>{{ formatJson(detail.req.body) }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div v-if="detail?.res">
      <h3>{{ t('httpList.response') }}</h3>
      <el-tabs>
        <el-tab-pane :label="t('httpList.response')">
          <div class="httprequest">
            {{ `HTTP/${detail.res.httpVersion} ${detail.res.statusCode} ${detail.res.statusMessage}` }}
          </div>
        </el-tab-pane>
        <el-tab-pane :label="t('httpList.header')">
          <div class="httpheader">
            <div v-for="[key, value] in Object.entries(detail.res.headers || {})" :key="key">
              <span>{{ key }}:</span>
              <span>{{ value }}</span>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="detail.res.body" :label="t('httpList.body')">
          <pre class="httpbody">{{ getBodyStr(detail.res) }}</pre>
        </el-tab-pane>
        <el-tab-pane v-if="isJson(detail.res) && !detail.res.err" :label="t('httpList.jsonBody')">
          <div class="httpbody">
            <pre>{{ formatJson(detail.res.body) }}</pre>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="detail.res.err" :label="t('httpList.error')">
          <pre class="httpbody">{{ detail.res.err }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getPath } from '../../../utils/utils';
import { useI18n } from '../../../composables/useI18n';
import type { HttpPackage } from '../../../stores/global';

const props = defineProps<{
  detail: HttpPackage | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
const visible = ref(true);

const isGet = computed(() => {
  return props.detail?.req.method.toLowerCase() === 'get';
});

const contentType = 'Content-Type';

const isJson = (req: any) => {
  return req?.headers && req.headers[contentType] && req.headers[contentType].toLowerCase().includes('json');
};

const getBodyStr = (req: any) => {
  if (!req || !req.body) {
    return '';
  }
  return typeof req.body === 'string' ? req.body : JSON.stringify(req.body, null, 2);
};

const formatJson = (jsonData: any) => {
  try {
    const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error(error);
    return jsonData;
  }
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.httpdetail h3 {
  margin: 20px 0 10px;
}

.httprequest {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
}

.httpheader {
  padding: 10px;
}

.httpheader div {
  display: flex;
  margin-bottom: 8px;
}

.httpheader span:first-child {
  font-weight: bold;
  margin-right: 8px;
  min-width: 150px;
}

.httpbody {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow: auto;
}
</style>
