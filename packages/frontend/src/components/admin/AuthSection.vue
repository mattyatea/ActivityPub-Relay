<template>
  <ElCard class="section" shadow="hover">
    <template #header>API Authentication</template>
    <ElForm label-position="top" @submit.prevent>
      <ElFormItem label="API Key">
        <ElInput
          v-model="localApiKey"
          :type="showApiKey ? 'text' : 'password'"
          placeholder="Enter your API key"
          :disabled="authenticated"
          show-password
          @keyup.enter="handleConnect"
          @change="showApiKey = false"
        />
      </ElFormItem>
      <ElSpace wrap>
        <ElButton
          type="primary"
          :disabled="!localApiKey || loading || authenticated"
          :loading="loading"
          @click="handleConnect"
        >
          {{ authenticated ? 'Authenticated' : 'Connect' }}
        </ElButton>
        <ElButton v-if="!authenticated" @click="showApiKey = !showApiKey">
          {{ showApiKey ? 'Hide' : 'Show' }}
        </ElButton>
        <ElButton v-if="authenticated" type="danger" plain @click="handleLogout">
          Disconnect
        </ElButton>
      </ElSpace>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElSpace } from 'element-plus';
import { ref } from 'vue';

interface Props {
	apiKey: string;
	authenticated: boolean;
	loading: boolean;
}

interface Emits {
	(e: 'connect', apiKey: string): void;
	(e: 'logout'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localApiKey = ref(props.apiKey);
const showApiKey = ref(false);

const handleConnect = () => {
	if (localApiKey.value) {
		emit('connect', localApiKey.value);
	}
};

const handleLogout = () => {
	emit('logout');
};
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}
</style>
