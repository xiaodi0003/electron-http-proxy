<template>
  <el-dialog
    v-model="visible"
    :title="setting.id ? 'Edit' : 'Add'"
    width="900px"
    @close="handleCancel"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="启用" prop="enabled">
        <el-switch v-model="formData.enabled" />
      </el-form-item>

      <el-form-item label="配置类型" prop="type">
        <el-radio-group v-model="formData.type" @change="handleTypeChange">
          <el-radio label="exact">Exact</el-radio>
          <el-radio label="prefix">Prefix</el-radio>
          <el-radio label="regex">Regex</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="匹配条件" prop="from">
        <el-input v-model="fromUrl" @blur="handleFromBlur">
          <template #prepend>
            <el-select v-model="fromProtocol" style="width: 90px" @change="updateFromUrl">
              <el-option label="http://" value="http" />
              <el-option label="https://" value="https" />
            </el-select>
          </template>
          <template #append>
            <span style="cursor: pointer" @click="showTest = !showTest">Test</span>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item v-if="showTest" label="Test" prop="test">
        <el-input v-model="testUrl">
          <template #append>
            <el-icon @click="showTest = false" style="cursor: pointer">
              <Close />
            </el-icon>
          </template>
        </el-input>
        <div v-if="testResult" :style="{ color: testResult.success ? '#67c23a' : '#f56c6c', marginTop: '4px', fontSize: '12px' }">
          {{ testResult.message }}
        </div>
      </el-form-item>

      <el-form-item label="代理目标" prop="to">
        <el-input v-model="toUrl" :disabled="formData.reqHook || toProtocol === 'har'" @blur="handleToBlur">
          <template #prepend>
            <el-select v-model="toProtocol" :disabled="formData.reqHook" style="width: 90px" @change="updateToUrl">
              <el-option label="http://" value="http" />
              <el-option label="https://" value="https" />
              <el-option label="file://" value="file" />
              <el-option label="har://" value="har" />
            </el-select>
          </template>
          <template #append v-if="toProtocol === 'file'">
            <input
              ref="fileInputRef"
              type="file"
              style="display: none"
              @change="handleSelectFile"
            />
            <input
              ref="folderInputRef"
              type="file"
              webkitdirectory
              directory
              style="display: none"
              @change="handleSelectFolder"
            />
            <el-button-group>
              <el-button type="text" @click="triggerFileSelect">选择文件</el-button>
              <el-button type="text" @click="triggerFolderSelect" style="margin-left: 8px">选择文件夹</el-button>
            </el-button-group>
          </template>
          <template #append v-if="toProtocol === 'har'">
            <input
              ref="harFileInputRef"
              type="file"
              accept=".har"
              style="display: none"
              @change="handleSelectHarFile"
            />
            <el-button type="text" @click="triggerHarFileSelect">上传HAR</el-button>
          </template>
        </el-input>
      </el-form-item>

      <!-- HAR ignore parameters configuration -->
      <el-form-item v-if="toProtocol === 'har'" label="忽略参数" prop="harIgnoreParams">
        <el-input
          v-model="formData.harIgnoreParams"
          placeholder="输入要忽略的参数名，多个参数用逗号分隔，如: timestamp,_t"
        />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          匹配时会忽略这些请求参数，适用于时间戳等动态参数
        </div>
      </el-form-item>

      <!-- Backend proxy configuration - only show for http/https targets -->
      <BackendProxyConfig
        v-if="(toProtocol === 'http' || toProtocol === 'https') && formData.backendProxy"
        v-model="formData.backendProxy"
      />

      <el-form-item label="延迟" prop="delay">
        <el-input-number v-model="formData.delay" :min="0" />
      </el-form-item>

      <el-form-item label="修改请求参数" prop="reqHook">
        <el-switch v-model="formData.reqHook" />
      </el-form-item>

      <el-form-item v-if="formData.reqHook" label="代码" prop="reqHookCode">
        <CodeEditor v-model="formData.reqHookCode" />
      </el-form-item>

      <el-form-item label="修改响应结果" prop="resHook">
        <el-switch v-model="formData.resHook" />
      </el-form-item>

      <el-form-item v-if="formData.resHook" label="代码" prop="resHookCode">
        <CodeEditor v-model="formData.resHookCode" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleOk">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Close } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { ProxySetting } from '../../../stores/global';
import { DEFAULT_BACKEND_PROXY } from '../../../stores/global';
import CodeEditor from './CodeEditor.vue';
import BackendProxyConfig from './BackendProxyConfig.vue';

const props = defineProps<{
  setting: ProxySetting;
}>();

const emit = defineEmits<{
  ok: [setting: ProxySetting];
  cancel: [];
}>();

const visible = ref(true);
const formRef = ref<FormInstance>();
const showTest = ref(false);
const testUrl = ref('');
const testResult = ref<{ success: boolean; message: string } | null>(null);
const fileInputRef = ref<HTMLInputElement>();
const folderInputRef = ref<HTMLInputElement>();
const harFileInputRef = ref<HTMLInputElement>();

const getInitReqChangeCode = () => `// 按需修改url、headers、body，可以返回具体的值，也可以返回一个Promise
// 注意：body如果是json，需要先stringify
async function reqHook({url, headers, body}) {
  return {url, headers, body};
}`;

const getInitResChangeCode = () => `// 按需修改headers、body，可以返回具体的值，也可以返回一个Promise
async function resHook(request, {code, headers, body}) {
  return {code, headers, body};
}`;

const formData = reactive<ProxySetting>({
  id: props.setting.id,
  enabled: props.setting.enabled !== false,
  type: props.setting.type || 'exact',
  from: props.setting.from || 'http://',
  to: props.setting.to || 'http://',
  reqHook: props.setting.reqHook || false,
  reqHookCode: props.setting.reqHookCode || getInitReqChangeCode(),
  resHook: props.setting.resHook || false,
  resHookCode: props.setting.resHookCode || getInitResChangeCode(),
  delay: props.setting.delay || 0,
  backendProxy: props.setting.backendProxy || { ...DEFAULT_BACKEND_PROXY },
  harFileName: props.setting.harFileName || '',
  harIgnoreParams: props.setting.harIgnoreParams || '',
});

// Store HAR data outside of reactive system to avoid performance issues
let harDataRef: any = null;

const removeProtocol = (url: string) => url.replace(/^.*?:\/\//, '');
const getProtocol = (url: string) => url.replace(/(.*?):.*/, '$1');
const hasProtocol = (url: string) => ['http', 'https', 'file', 'har'].includes(getProtocol(url));

const fromProtocol = ref(getProtocol(formData.from));
const fromUrl = ref(removeProtocol(formData.from));
const toProtocol = ref(getProtocol(formData.to));
const toUrl = ref(removeProtocol(formData.to));

const updateFromUrl = () => {
  formData.from = `${fromProtocol.value}://${fromUrl.value}`;
};

const updateToUrl = () => {
  formData.to = `${toProtocol.value}://${toUrl.value}`;
};

const handleFromBlur = () => {
  if (hasProtocol(fromUrl.value)) {
    fromProtocol.value = getProtocol(fromUrl.value);
    fromUrl.value = removeProtocol(fromUrl.value);
  }
  updateFromUrl();
};

const handleToBlur = () => {
  if (hasProtocol(toUrl.value)) {
    toProtocol.value = getProtocol(toUrl.value);
    toUrl.value = removeProtocol(toUrl.value);
  }
  updateToUrl();
};

const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

const triggerFolderSelect = () => {
  folderInputRef.value?.click();
};

const triggerHarFileSelect = () => {
  harFileInputRef.value?.click();
};

const handleSelectHarFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) {
    return;
  }

  try {
    const content = await file.text();
    const harData = JSON.parse(content);
    
    // Validate HAR format
    if (!harData.log || !harData.log.entries) {
      throw new Error('Invalid HAR file format');
    }
    
    // Store HAR data outside reactive system
    harDataRef = harData;
    
    // Store file name in reactive formData
    formData.harFileName = file.name;
    
    // Use full path if available (Electron environment), otherwise use file name
    const filePath = (file as any).path || file.name;
    toUrl.value = filePath;
    updateToUrl();
    
    // Reset file input
    target.value = '';
  } catch (error) {
    console.error('Failed to load HAR file:', error);
    alert(error instanceof Error ? error.message : '加载HAR文件失败');
    target.value = '';
  }
};

const handleSelectFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    const file = files[0] as any;
    if (file.path) {
      toUrl.value = file.path;
      updateToUrl();
    }
  }
  
  // Reset input to allow selecting the same file again
  target.value = '';
};

const handleSelectFolder = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (files && files.length > 0) {
    const file = files[0] as any;
    if (file.path) {
      let folderPath = file.path;
      
      // Extract folder path from the first file's path
      if (file.webkitRelativePath) {
        const relativePath = file.webkitRelativePath;
        const folderName = relativePath.split('/')[0];
        // Remove the relative path part to get the base folder path
        const pathParts = folderPath.split('/');
        const relativePathParts = relativePath.split('/');
        // Remove the file name and subfolder parts
        folderPath = pathParts.slice(0, pathParts.length - relativePathParts.length + 1).join('/') + '/' + folderName;
      } else {
        // Fallback: remove the file name to get folder path
        folderPath = folderPath.substring(0, folderPath.lastIndexOf('/'));
      }
      
      // Ensure folder path ends with /
      if (!folderPath.endsWith('/')) {
        folderPath += '/';
      }
      
      toUrl.value = folderPath;
      updateToUrl();
    }
  }
  
  // Reset input to allow selecting the same folder again
  target.value = '';
};

const testFrom = (testUrl: string, fromUrl: string, nowType: string) => {
  switch (nowType) {
    case 'regex':
      return new RegExp(fromUrl).test(testUrl);
    case 'prefix':
      return testUrl.startsWith(fromUrl);
    case 'exact':
    default:
      return testUrl === fromUrl;
  }
};

const validateTest = () => {
  if (testUrl.value) {
    const isMatch = testFrom(testUrl.value, formData.from, formData.type);
    if (isMatch) {
      testResult.value = { success: true, message: '✓ 匹配成功' };
    } else {
      testResult.value = { success: false, message: '✗ 匹配失败' };
    }
  } else {
    testResult.value = null;
  }
};

const handleTypeChange = () => {
  testResult.value = null;
  if (testUrl.value) {
    validateTest();
  }
};

const rules: FormRules = {
  from: [{ required: true, message: '必填', trigger: 'blur' }],
  to: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (!formData.reqHook && !value) {
          callback(new Error('必填'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  'backendProxy.host': [
    {
      validator: (rule, value, callback) => {
        // Only validate when proxy type is http or socks5 and target is http/https
        if (
          (toProtocol.value === 'http' || toProtocol.value === 'https') &&
          formData.backendProxy &&
          (formData.backendProxy.type === 'http' || formData.backendProxy.type === 'socks5')
        ) {
          if (!value || value.trim() === '') {
            callback(new Error('代理服务器地址不能为空'));
            return;
          }
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  'backendProxy.port': [
    {
      validator: (rule, value, callback) => {
        // Only validate when proxy type is http or socks5 and target is http/https
        if (
          (toProtocol.value === 'http' || toProtocol.value === 'https') &&
          formData.backendProxy &&
          (formData.backendProxy.type === 'http' || formData.backendProxy.type === 'socks5')
        ) {
          if (!value || value < 1 || value > 65535) {
            callback(new Error('端口号必须在 1-65535 之间'));
            return;
          }
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
};

const handleOk = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate((valid) => {
    if (valid) {
      // Attach HAR data only when submitting
      const settingToSave: any = { ...formData };
      if (harDataRef) {
        settingToSave.harData = harDataRef;
      }
      emit('ok', settingToSave);
    }
  });
};

const handleCancel = () => {
  emit('cancel');
};

watch(() => formData.reqHook, (val) => {
  if (val) {
    formRef.value?.clearValidate('to');
  }
});

// 监听 testUrl 变化，实时验证
watch(testUrl, () => {
  validateTest();
});

// 监听 formData.from 变化，实时验证
watch(() => formData.from, () => {
  if (testUrl.value) {
    validateTest();
  }
});
</script>

<style scoped>
:deep(.el-form-item__content) {
  line-height: normal;
}
</style>
