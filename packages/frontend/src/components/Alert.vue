<template>
  <ElAlert
    v-if="visible"
    class="app-alert"
    :title="message"
    :type="type"
    :closable="closeable"
    show-icon
    @close="close"
  />
</template>

<script setup lang="ts">
import { ElAlert } from 'element-plus';
import { onMounted, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		message: string;
		type?: 'success' | 'error' | 'warning' | 'info';
		closeable?: boolean;
		autoDismiss?: boolean;
		dismissDuration?: number;
	}>(),
	{
		type: 'info',
		closeable: true,
		autoDismiss: true,
		dismissDuration: 5000,
	},
);

const visible = ref(true);
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const close = () => {
	visible.value = false;
	if (dismissTimer) {
		clearTimeout(dismissTimer);
	}
};

onMounted(() => {
	if (props.autoDismiss) {
		dismissTimer = setTimeout(() => {
			visible.value = false;
		}, props.dismissDuration);
	}
});
</script>

<style scoped>
.app-alert {
  margin-bottom: 24px;
}
</style>
