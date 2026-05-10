<template>
	<ElDialog
		:model-value="isOpen"
		:title="title"
		width="min(480px, 90vw)"
		@close="onCancel"
	>
		<p class="dialog-message">{{ message }}</p>
		<template #footer>
			<ElButton @click="onCancel">Cancel</ElButton>
			<ElButton type="primary" @click="onConfirm">Confirm</ElButton>
		</template>
	</ElDialog>
</template>

<script setup lang="ts">
import { ElButton, ElDialog } from 'element-plus';

interface Props {
	isOpen: boolean;
	title: string;
	message: string;
}

interface Emits {
	(e: 'confirm'): void;
	(e: 'cancel'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const onConfirm = () => {
	emit('confirm');
};

const onCancel = () => {
	emit('cancel');
};
</script>

<style scoped>
.dialog-message {
	margin: 0;
	line-height: 1.5;
}
</style>
