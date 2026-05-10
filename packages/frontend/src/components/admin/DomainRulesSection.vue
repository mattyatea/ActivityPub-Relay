<template>
  <ElCard class="section" shadow="hover">
    <template #header>Domain Rules</template>
    <ElForm label-position="top" @submit.prevent>
      <ElFormItem
        label="Pattern"
        :error="!isValidPattern && newRule.pattern ? 'Invalid pattern format' : ''"
      >
        <ElInput
          v-model="newRule.pattern"
          placeholder="example.com"
          :validate-event="false"
          @keyup.enter="handleAddRule"
        />
      </ElFormItem>
      <ElFormItem>
        <ElCheckbox v-model="newRule.isRegex">Is Regex Pattern</ElCheckbox>
        <ElText v-if="newRule.isRegex" class="help-text" type="info">
          JavaScript regex pattern (e.g., ^example\.com$)
        </ElText>
      </ElFormItem>
      <ElFormItem label="Reason (optional)">
        <ElInput
          v-model="newRule.reason"
          placeholder="Why block/allow this domain?"
          @keyup.enter="handleAddRule"
        />
      </ElFormItem>
      <ElButton
        type="primary"
        :disabled="!newRule.pattern || !isValidPattern"
        :loading="adding"
        @click="handleAddRule"
      >
        Add Rule
      </ElButton>
    </ElForm>

    <ElTable v-if="domainRules.length > 0" class="rules-table" :data="domainRules" style="width: 100%">
      <ElTableColumn prop="pattern" label="Pattern" min-width="180" />
      <ElTableColumn label="Type" width="100">
        <template #default="{ row }">
          <ElTag v-if="row.isRegex" type="primary">Regex</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="reason" label="Reason" min-width="220" show-overflow-tooltip />
      <ElTableColumn label="Actions" width="120" align="right">
        <template #default="{ row }">
          <ElButton
            type="danger"
            size="small"
            plain
            :loading="deleting.has(row.id)"
            @click="$emit('delete', row.id)"
          >
            Delete
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <ElEmpty v-else description="No domain rules configured" />
  </ElCard>
</template>

<script setup lang="ts">
import {
	ElButton,
	ElCard,
	ElCheckbox,
	ElEmpty,
	ElForm,
	ElFormItem,
	ElInput,
	ElTable,
	ElTableColumn,
	ElTag,
	ElText,
} from 'element-plus';
import { computed, reactive, ref } from 'vue';
import type { DomainRule, NewDomainRule } from '../../types/api';

interface Props {
	domainRules: DomainRule[];
	adding?: boolean;
}

interface Emits {
	(e: 'add', rule: NewDomainRule): void;
	(e: 'delete', id: number): void;
}

withDefaults(defineProps<Props>(), {
	adding: false,
});
const emit = defineEmits<Emits>();

const newRule = ref<NewDomainRule>({
	pattern: '',
	isRegex: false,
	reason: '',
});

const deleting = reactive(new Set<number>());

const isValidPattern = computed(() => {
	if (!newRule.value.pattern) return true;
	if (newRule.value.isRegex) {
		try {
			new RegExp(newRule.value.pattern);
			return true;
		} catch {
			return false;
		}
	}
	return true;
});

const handleAddRule = () => {
	if (newRule.value.pattern && isValidPattern.value) {
		emit('add', { ...newRule.value });
		newRule.value = { pattern: '', isRegex: false, reason: '' };
	}
};
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}

.help-text {
  display: block;
  margin-top: 4px;
}

.rules-table {
  margin-top: 24px;
}
</style>
