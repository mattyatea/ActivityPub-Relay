<template>
	<ElCard class="section" shadow="hover">
		<template #header>Follow Requests</template>
		<ElEmpty
			v-if="followRequests.length === 0"
			description="No pending follow requests"
		/>
		<ElTable v-else :data="followRequests" style="width: 100%">
			<ElTableColumn prop="id" label="ID" min-width="140" />
			<ElTableColumn
				prop="actorId"
				label="Actor"
				min-width="280"
				show-overflow-tooltip
			/>
			<ElTableColumn label="Actions" width="210" align="right">
				<template #default="{ row }">
					<ElSpace>
						<ElButton
							type="primary"
							size="small"
							:loading="loadingActions.approve.has(row.id)"
							@click="$emit('approve', row.id)"
						>
							Approve
						</ElButton>
						<ElButton
							type="danger"
							size="small"
							plain
							:loading="loadingActions.reject.has(row.id)"
							@click="$emit('reject', row.id)"
						>
							Reject
						</ElButton>
					</ElSpace>
				</template>
			</ElTableColumn>
		</ElTable>
	</ElCard>
</template>

<script setup lang="ts">
import {
	ElButton,
	ElCard,
	ElEmpty,
	ElSpace,
	ElTable,
	ElTableColumn,
} from 'element-plus';
import { reactive } from 'vue';
import type { FollowRequest } from '../../types/api';

interface Props {
	followRequests: FollowRequest[];
}

interface Emits {
	(e: 'approve', id: string): void;
	(e: 'reject', id: string): void;
}

defineProps<Props>();
defineEmits<Emits>();

const loadingActions = reactive({
	approve: new Set<string>(),
	reject: new Set<string>(),
});
</script>

<style scoped>
.section {
	margin-bottom: 24px;
}
</style>
