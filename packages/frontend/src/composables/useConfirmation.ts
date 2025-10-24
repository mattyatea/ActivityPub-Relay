import { ref } from 'vue';

export function useConfirmation() {
	const isOpen = ref(false);
	const message = ref('');
	const title = ref('');
	const confirmCallback = ref<(() => void) | null>(null);
	const cancelCallback = ref<(() => void) | null>(null);

	const confirm = (
		msg: string,
		onConfirm: () => void,
		options?: {
			title?: string;
			onCancel?: () => void;
		},
	) => {
		message.value = msg;
		title.value = options?.title || 'Confirm';
		confirmCallback.value = onConfirm;
		cancelCallback.value = options?.onCancel || null;
		isOpen.value = true;
	};

	const proceed = () => {
		if (confirmCallback.value) {
			confirmCallback.value();
		}
		isOpen.value = false;
	};

	const cancel = () => {
		if (cancelCallback.value) {
			cancelCallback.value();
		}
		isOpen.value = false;
	};

	return {
		isOpen,
		message,
		title,
		confirm,
		proceed,
		cancel,
	};
}
