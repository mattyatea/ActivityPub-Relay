<template>
  <ElCard class="section" shadow="hover">
    <template #header>Settings</template>
    <ElForm label-position="top" @submit.prevent>
      <ElFormItem label="Domain Block Mode">
        <ElSelect v-model="localSettings.domainBlockMode">
          <ElOption label="Whitelist (only allow listed domains)" value="whitelist" />
          <ElOption label="Blacklist (block listed domains)" value="blacklist" />
        </ElSelect>
      </ElFormItem>
      <ElButton type="primary" :loading="saving" @click="handleSave">
        Save Settings
      </ElButton>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
import { ElButton, ElCard, ElForm, ElFormItem, ElOption, ElSelect } from 'element-plus';
import { ref, watch } from 'vue';
import type { Settings } from '../../types/api';

interface Props {
	settings: Settings;
	saving?: boolean;
}

type Emits = (e: 'save', settings: Settings) => void;

const props = withDefaults(defineProps<Props>(), {
	saving: false,
});
const emit = defineEmits<Emits>();

const localSettings = ref<Settings>({ ...props.settings });

watch(
	() => props.settings,
	(newSettings) => {
		localSettings.value = { ...newSettings };
	},
	{ deep: true },
);

const handleSave = () => {
	emit('save', localSettings.value);
};
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}
</style>
