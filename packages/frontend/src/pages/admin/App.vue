<template>
  <MainLayout currentPage="admin">
    <div class="admin">
      <h1>Admin Panel</h1>

      <Alert
        v-if="alertMessage"
        :message="alertMessage"
        :type="alertType"
        :autoDismiss="true"
      />

      <!-- Authentication Section -->
      <AuthSection
        :apiKey="apiKey"
        :authenticated="authenticated"
        :loading="loading"
        @connect="handleConnect"
        @logout="handleLogout"
      />

      <!-- Settings Section -->
      <SettingsSection
        v-if="authenticated"
        :settings="settings"
        :saving="savingSettings"
        @save="handleUpdateSettings"
      />

      <!-- Follow Requests Section -->
      <FollowRequestsSection
        v-if="authenticated"
        :followRequests="followRequests"
        @approve="handleApproveFollow"
        @reject="handleRejectFollow"
      />

      <!-- Delivery Servers Section -->
      <DeliveryServersSection
        v-if="authenticated"
        :actors="actors"
        :actorTotal="actorTotal"
        @removeActor="handleRemoveActor"
      />

      <!-- Domain Rules Section -->
      <DomainRulesSection
        v-if="authenticated"
        :domainRules="domainRules"
        :adding="addingRule"
        @add="handleAddRule"
        @delete="handleDeleteRule"
      />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { orpc, setApiKey } from '@/composables/useApiClient';
import { useApiError } from '@/composables/useApiError';
import type {
	Actor,
	AlertType,
	DomainRule,
	FollowRequest,
	NewDomainRule,
	Settings,
} from '@/types/api';
import Alert from '../../components/Alert.vue';
import AuthSection from '../../components/admin/AuthSection.vue';
import DeliveryServersSection from '../../components/admin/DeliveryServersSection.vue';
import DomainRulesSection from '../../components/admin/DomainRulesSection.vue';
import FollowRequestsSection from '../../components/admin/FollowRequestsSection.vue';
import SettingsSection from '../../components/admin/SettingsSection.vue';
import MainLayout from '../../layouts/MainLayout.vue';

// Composables
const { getErrorMessage, isAuthError } = useApiError();

// State
const apiKey = ref('');
const authenticated = ref(false);
const loading = ref(false);
const alertMessage = ref('');
const alertType = ref<AlertType>('info');

const settings = ref<Settings>({
	domainBlockMode: 'blacklist' as 'whitelist' | 'blacklist',
});

const followRequests = ref<FollowRequest[]>([]);
const domainRules = ref<DomainRule[]>([]);
const actors = ref<Actor[]>([]);
const actorTotal = ref(0);

// Loading states
const savingSettings = ref(false);
const addingRule = ref(false);

// Alert helper
const showAlert = (message: string, type: AlertType = 'info') => {
	alertMessage.value = message;
	alertType.value = type;
};

// Auth handlers
const handleConnect = async (key: string) => {
	apiKey.value = key;
	loading.value = true;
	try {
		setApiKey(key);
		await loadData();
		authenticated.value = true;
		showAlert('Connected successfully!', 'success');
	} catch (error) {
		console.error('Connection error:', error);
		if (isAuthError(error)) {
			showAlert('Authentication failed: Invalid API key', 'error');
		} else {
			showAlert('Failed to connect: ' + getErrorMessage(error), 'error');
		}
		authenticated.value = false;
		setApiKey(''); // Clear the invalid API key
	} finally {
		loading.value = false;
	}
};

const handleLogout = () => {
	apiKey.value = '';
	authenticated.value = false;
	followRequests.value = [];
	domainRules.value = [];
	actors.value = [];
	actorTotal.value = 0;
	setApiKey('');
	showAlert('Disconnected', 'info');
};

// Data loading
const loadData = async () => {
	// Load settings
	const settingsData = await orpc.settings.get({});
	settings.value = settingsData;

	// Load follow requests
	const followData = await orpc.followRequests.list({
		status: 'pending',
		limit: 50,
		offset: 0,
	});
	followRequests.value = followData.requests;

	// Load domain rules
	const rulesData = await orpc.domainRules.list({
		limit: 50,
		offset: 0,
	});
	domainRules.value = rulesData.rules;

	// Load actors (delivery servers)
	const actorsData = await orpc.actors.list({
		limit: 100,
		offset: 0,
	});
	actors.value = actorsData.actors;
	actorTotal.value = actorsData.total;
};

// Settings handlers
const handleUpdateSettings = async (newSettings: Settings) => {
	savingSettings.value = true;
	try {
		const result = await orpc.settings.update({
			domainBlockMode: newSettings.domainBlockMode,
		});

		if (result.success) {
			settings.value = newSettings;
			showAlert('Settings updated!', 'success');
		} else {
			showAlert('Failed to update settings', 'error');
		}
	} catch (error) {
		console.error('Failed to update settings:', error);
		showAlert('Failed to update settings: ' + getErrorMessage(error), 'error');
	} finally {
		savingSettings.value = false;
	}
};

// Follow request handlers
const handleApproveFollow = async (id: string) => {
	try {
		const result = await orpc.followRequests.approve({ id });
		if (result.success) {
			followRequests.value = followRequests.value.filter((r) => r.id !== id);
			showAlert('Follow request approved!', 'success');
			// Reload actors list to include the newly approved server
			const actorsData = await orpc.actors.list({ limit: 100, offset: 0 });
			actors.value = actorsData.actors;
			actorTotal.value = actorsData.total;
		} else {
			showAlert('Failed to approve follow', 'error');
		}
	} catch (error) {
		console.error('Failed to approve follow:', error);
		showAlert('Failed to approve follow: ' + getErrorMessage(error), 'error');
	}
};

const handleRejectFollow = async (id: string) => {
	try {
		const result = await orpc.followRequests.reject({ id });
		if (result.success) {
			followRequests.value = followRequests.value.filter((r) => r.id !== id);
			showAlert('Follow request rejected', 'info');
		} else {
			showAlert('Failed to reject follow', 'error');
		}
	} catch (error) {
		console.error('Failed to reject follow:', error);
		showAlert('Failed to reject follow: ' + getErrorMessage(error), 'error');
	}
};

// Domain rule handlers
const handleAddRule = async (rule: NewDomainRule) => {
	addingRule.value = true;
	try {
		const result = await orpc.domainRules.add({
			pattern: rule.pattern,
			isRegex: rule.isRegex,
			reason: rule.reason || undefined,
		});

		if (result.success) {
			// Reload domain rules
			const rulesData = await orpc.domainRules.list({ limit: 50, offset: 0 });
			domainRules.value = rulesData.rules;
			showAlert('Rule added successfully!', 'success');
		} else {
			showAlert('Failed to add rule', 'error');
		}
	} catch (error) {
		console.error('Failed to add rule:', error);
		showAlert('Failed to add rule: ' + getErrorMessage(error), 'error');
	} finally {
		addingRule.value = false;
	}
};

const handleDeleteRule = async (id: number) => {
	try {
		const result = await orpc.domainRules.remove({ id });
		if (result.success) {
			domainRules.value = domainRules.value.filter((r) => r.id !== id);
			showAlert('Rule deleted', 'success');
		} else {
			showAlert('Failed to delete rule', 'error');
		}
	} catch (error) {
		console.error('Failed to delete rule:', error);
		showAlert('Failed to delete rule: ' + getErrorMessage(error), 'error');
	}
};

// Actor removal handler
const handleRemoveActor = async (actorId: string) => {
	try {
		const result = await orpc.actors.remove({ id: actorId });
		if (result.success) {
			actors.value = actors.value.filter((a) => a.id !== actorId);
			actorTotal.value = Math.max(0, actorTotal.value - 1);
			showAlert(
				'Server removed successfully. Reject activity sent.',
				'success',
			);
		} else {
			showAlert('Failed to remove server', 'error');
		}
	} catch (error) {
		console.error('Failed to remove actor:', error);
		showAlert('Failed to remove server: ' + getErrorMessage(error), 'error');
	}
};
</script>

<style scoped>
.admin {
  width: 800px;
  max-width: calc(100vw - 40px);
  margin: 0 auto;
  padding: 32px 20px;
}

.admin h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 24px;
  letter-spacing: -0.5px;
}

@media (max-width: 768px) {
  .admin {
    width: 100%;
    max-width: calc(100vw - 32px);
    padding: 20px 16px;
  }

  .admin h1 {
    font-size: 24px;
  }
}
</style>
