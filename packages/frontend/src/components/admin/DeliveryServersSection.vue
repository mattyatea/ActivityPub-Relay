<template>
  <ElCard class="section" shadow="hover">
    <template #header>Delivery Servers</template>
    <ElEmpty v-if="actors.length === 0" description="No servers currently being delivered to" />
    <template v-else>
      <ElTable :data="actors" style="width: 100%">
        <ElTableColumn label="Domain" min-width="180">
          <template #default="{ row }">
            {{ extractDomain(row.id) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="inbox" label="Inbox" min-width="320" show-overflow-tooltip />
        <ElTableColumn label="Actions" width="120" align="right">
          <template #default="{ row }">
            <ElButton type="danger" size="small" plain @click="handleRemove(row.id)">
              Remove
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <ElText v-if="actorTotal > actors.length" class="list-footer" type="info">
        Showing {{ actors.length }} of {{ actorTotal }} servers
      </ElText>
    </template>
    <ConfirmationDialog
      :isOpen="showConfirmDialog"
      title="Remove Delivery Server"
      :message="`Are you sure you want to remove ${extractDomain(actorToRemove || '')}? A Reject activity will be sent to this server.`"
      @confirm="confirmRemove"
      @cancel="cancelRemove"
    />
  </ElCard>
</template>

<script setup lang="ts">
import { ElButton, ElCard, ElEmpty, ElTable, ElTableColumn, ElText } from 'element-plus';
import { ref } from 'vue';
import type { Actor } from '../../types/api';
import ConfirmationDialog from '../ConfirmationDialog.vue';

interface Props {
	actors: Actor[];
	actorTotal: number;
}

defineProps<Props>();

const emit = defineEmits<{
	removeActor: [actorId: string];
}>();

const showConfirmDialog = ref(false);
const actorToRemove = ref<string | null>(null);

const handleRemove = (actorId: string) => {
	actorToRemove.value = actorId;
	showConfirmDialog.value = true;
};

const confirmRemove = () => {
	if (actorToRemove.value) {
		emit('removeActor', actorToRemove.value);
	}
	showConfirmDialog.value = false;
	actorToRemove.value = null;
};

const cancelRemove = () => {
	showConfirmDialog.value = false;
	actorToRemove.value = null;
};

const extractDomain = (url: string): string => {
	try {
		const urlObj = new URL(url);
		return urlObj.hostname;
	} catch {
		return url;
	}
};
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}

.list-footer {
  display: block;
  margin-top: 12px;
  text-align: center;
}
</style>
