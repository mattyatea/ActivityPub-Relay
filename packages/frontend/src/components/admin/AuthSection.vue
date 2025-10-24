<template>
  <Card title="API Authentication" class="section">
    <div class="form-group">
      <input
        v-model="localApiKey"
        :type="showApiKey ? 'text' : 'password'"
        placeholder="Enter your API key"
        @keyup.enter="handleConnect"
        :disabled="authenticated"
      />
    </div>
    <div class="button-group">
      <button
        @click="handleConnect"
        :disabled="!localApiKey || loading"
      >
        {{ authenticated ? 'Authenticated' : 'Connect' }}
      </button>
      <button
        v-if="!authenticated"
        type="button"
        @click="showApiKey = !showApiKey"
        class="toggle-visibility"
        :aria-label="showApiKey ? 'Hide API key' : 'Show API key'"
      >
        {{ showApiKey ? '👁' : '👁‍🗨' }}
      </button>
      <button v-if="authenticated" @click="handleLogout" class="danger">
        Disconnect
      </button>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from '../Card.vue';

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

.form-group {
  margin-bottom: 12px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.toggle-visibility {
  padding: 8px 12px;
  font-size: 16px;
}
</style>
