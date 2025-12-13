<template>
  <el-dialog
    v-model="visible"
    :title="item.id ? '编辑代理例外' : '添加代理例外'"
    width="600px"
    @close="handleCancel"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="启用" prop="enabled">
        <el-switch v-model="formData.enabled" />
      </el-form-item>

      <el-form-item label="域名" prop="domain">
        <el-input 
          v-model="formData.domain" 
          placeholder="例如: example.com 或 *.example.com"
        />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          支持精确域名或通配符，如: *outlook*, example.com
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleOk">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { BypassListItem } from '../../../stores/global';

const props = defineProps<{
  item: BypassListItem;
}>();

const emit = defineEmits<{
  ok: [item: BypassListItem];
  cancel: [];
}>();

const visible = ref(true);
const formRef = ref<FormInstance>();

const formData = reactive<BypassListItem>({
  id: props.item.id,
  enabled: props.item.enabled !== false,
  domain: props.item.domain || '',
});

const rules: FormRules = {
  domain: [
    { required: true, message: '域名不能为空', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback(new Error('域名不能为空'));
          return;
        }
        const trimmed = value.trim();
        
        // Allow flexible wildcard patterns with *, letters, numbers, dots, and hyphens
        const pattern = /^[\*a-zA-Z0-9][\*a-zA-Z0-9.-]*[\*a-zA-Z0-9]$|^[\*a-zA-Z0-9]$/;
        
        if (!pattern.test(trimmed)) {
          callback(new Error('域名格式不正确'));
          return;
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
      emit('ok', { ...formData, domain: formData.domain.trim() });
    }
  });
};

const handleCancel = () => {
  emit('cancel');
};
</script>
