import type { Context } from 'hono';
import type { APActivity } from '@/types/activityPubTypes.ts';

export type QueueData = {
	inbox: string;
	activity: APActivity;
	activityJson: string;
};

export async function addQueue(
	queueData: QueueData,
	context: Context<{
		Bindings: Env;
	}>,
) {
	await context.env.MY_QUEUE.send(queueData);
}
