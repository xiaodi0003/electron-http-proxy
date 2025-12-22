# React 到 Vue 迁移对比

## 组件语法对比

### React (Hooks)
```tsx
import React, { useState, useEffect } from 'react';
import { connect } from 'umi';

const Component: React.FC<Props> = ({ global, dispatch }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // 副作用
  }, []);
  
  return <div>{state}</div>;
};

export default connect(({ global }) => ({ global }))(Component);
```

### Vue 3 (Composition API)
```vue
<template>
  <div>{{ state }}</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useGlobalStore } from '@/stores/global';

const globalStore = useGlobalStore();
const { someData } = storeToRefs(globalStore);

const state = ref(initialValue);

onMounted(() => {
  // 副作用
});
</script>
```

## 状态管理对比

### React (DVA/Redux)
```typescript
// model
export default {
  namespace: 'global',
  state: { data: [] },
  reducers: {
    updateData(state, { payload }) {
      return { ...state, data: payload };
    }
  }
};

// 使用
dispatch({ type: 'global/updateData', payload: newData });
```

### Vue (Pinia)
```typescript
// store
export const useGlobalStore = defineStore('global', {
  state: () => ({ data: [] }),
  actions: {
    updateData(payload) {
      this.data = payload;
    }
  }
});

// 使用
const store = useGlobalStore();
store.updateData(newData);
```

## UI 组件对比

### 表格
```tsx
// React (Ant Design)
<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
/>
```

```vue
<!-- Vue (Element Plus) -->
<el-table :data="data" row-key="id">
  <el-table-column prop="name" label="Name" />
  <el-table-column prop="age" label="Age" />
</el-table>
```

### 表单
```tsx
// React (Ant Design)
<Form form={form} onFinish={onFinish}>
  <Form.Item name="username" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

```vue
<!-- Vue (Element Plus) -->
<el-form :model="form" :rules="rules" ref="formRef">
  <el-form-item prop="username">
    <el-input v-model="form.username" />
  </el-form-item>
</el-form>
```

### 对话框
```tsx
// React (Ant Design)
<Modal
  visible={visible}
  onOk={handleOk}
  onCancel={handleCancel}
>
  {content}
</Modal>
```

```vue
<!-- Vue (Element Plus) -->
<el-dialog
  v-model="visible"
  @close="handleCancel"
>
  <template #footer>
    <el-button @click="handleCancel">取消</el-button>
    <el-button type="primary" @click="handleOk">确定</el-button>
  </template>
  {{ content }}
</el-dialog>
```

## 事件处理对比

### React
```tsx
<button onClick={() => handleClick(item)}>Click</button>
<input onChange={(e) => setValue(e.target.value)} />
```

### Vue
```vue
<button @click="handleClick(item)">Click</button>
<input v-model="value" @input="handleInput" />
```

## 条件渲染对比

### React
```tsx
{condition && <div>Content</div>}
{condition ? <div>Yes</div> : <div>No</div>}
```

### Vue
```vue
<div v-if="condition">Content</div>
<div v-if="condition">Yes</div>
<div v-else>No</div>
```

## 列表渲染对比

### React
```tsx
{list.map((item, index) => (
  <div key={item.id}>{item.name}</div>
))}
```

### Vue
```vue
<div v-for="(item, index) in list" :key="item.id">
  {{ item.name }}
</div>
```

## 生命周期对比

| React Hooks | Vue Composition API |
|------------|---------------------|
| `useEffect(() => {}, [])` | `onMounted(() => {})` |
| `useEffect(() => {})` | `watchEffect(() => {})` |
| `useEffect(() => {}, [dep])` | `watch(() => dep, () => {})` |
| `useEffect(() => { return cleanup })` | `onUnmounted(() => {})` |

## Refs 对比

### React
```tsx
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();
```

### Vue
```vue
<script setup>
const inputRef = ref<HTMLInputElement>();
inputRef.value?.focus();
</script>

<template>
  <input ref="inputRef" />
</template>
```

## Props 对比

### React
```tsx
interface Props {
  title: string;
  count: number;
}

const Component: React.FC<Props> = ({ title, count }) => {
  return <div>{title}: {count}</div>;
};
```

### Vue
```vue
<script setup lang="ts">
interface Props {
  title: string;
  count: number;
}

const props = defineProps<Props>();
</script>

<template>
  <div>{{ title }}: {{ count }}</div>
</template>
```

## Emit 事件对比

### React
```tsx
interface Props {
  onSave: (data: Data) => void;
}

const Component: React.FC<Props> = ({ onSave }) => {
  return <button onClick={() => onSave(data)}>Save</button>;
};
```

### Vue
```vue
<script setup lang="ts">
const emit = defineEmits<{
  save: [data: Data];
}>();

const handleSave = () => {
  emit('save', data);
};
</script>

<template>
  <button @click="handleSave">Save</button>
</template>
```

## 计算属性对比

### React
```tsx
const fullName = useMemo(() => {
  return `${firstName} ${lastName}`;
}, [firstName, lastName]);
```

### Vue
```vue
<script setup>
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});
</script>
```

## 样式处理对比

### React
```tsx
import styles from './index.less';

<div className={styles.container}>Content</div>
<div className={classNames(styles.item, { [styles.active]: isActive })}>Item</div>
```

### Vue
```vue
<template>
  <div class="container">Content</div>
  <div :class="['item', { active: isActive }]">Item</div>
</template>

<style scoped>
.container { /* styles */ }
.item { /* styles */ }
.item.active { /* styles */ }
</style>
```
