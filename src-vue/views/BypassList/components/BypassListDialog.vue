<template>
  <el-dialog
    v-model="visible"
    :title="item.id ? t('bypassList.editTitle') : t('bypassList.addTitle')"
    width="600px"
    @close="handleCancel"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item :label="t('common.enabled')" prop="enabled">
        <el-switch v-model="formData.enabled" />
      </el-form-item>

      <el-form-item :label="t('bypassList.domain')" prop="domain">
        <el-input 
          v-model="formData.domain" 
          :placeholder="t('bypassList.domainPlaceholder')"
        />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          {{ t('bypassList.domainHint') }}
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleOk">{{ t('common.ok') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { BypassListItem } from '../../../stores/global';
import { useI18n } from '../../../composables/useI18n';

const props = defineProps<{
  item: BypassListItem;
}>();

const emit = defineEmits<{
  ok: [item: BypassListItem];
  cancel: [];
}>();

const { t } = useI18n();
const visible = ref(true);
const formRef = ref<FormInstance>();

const formData = reactive<BypassListItem>({
  id: props.item.id,
  enabled: props.item.enabled !== false,
  domain: props.item.domain || '',
});

const rules: FormRules = {
  domain: [
    { required: true, message: t('bypassList.domainRequired'), trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!value || value.trim() === '') {
          callback(new Error(t('bypassList.domainRequired')));
          return;
        }
        const trimmed = value.trim();
        
        // Allow flexible wildcard patterns with *, letters, numbers, dots, and hyphens
        const pattern = /^[\*a-zA-Z0-9][\*a-zA-Z0-9.-]*[\*a-zA-Z0-9]$|^[\*a-zA-Z0-9]$/;
        
        if (!pattern.test(trimmed)) {
          callback(new Error(t('bypassList.domainFormatError')));
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
