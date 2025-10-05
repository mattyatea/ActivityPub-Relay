import { oc } from '@orpc/contract';
import { z } from 'zod';

// ============================================================
// Shared Schemas
// ============================================================

const DomainBlockModeSchema = z.enum(['whitelist', 'blacklist']);

const FollowRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);

const FollowRequestItemSchema = z.object({
	id: z.string(),
	actorId: z.string().url(),
	status: FollowRequestStatusSchema,
	createdAt: z.number().int().optional(),
});

const DomainRuleSchema = z.object({
	id: z.number().int().positive(),
	pattern: z.string().min(1),
	isRegex: z.boolean(),
	reason: z.string().optional(),
	createdAt: z.number().int().optional(),
});

// Contract Definition
export const contract = {
	settings: {
		get: oc
			.route({
				method: 'GET',
				path: '/settings',
			})
			.input(z.object({}))
			.output(
				z.object({
					domainBlockMode: DomainBlockModeSchema,
				}),
			),
		update: oc
			.route({
				method: 'POST',
				path: '/settings',
			})
			.input(
				z.object({
					domainBlockMode: DomainBlockModeSchema.optional(),
				}),
			)
			.output(
				z.object({
					success: z.boolean(),
				}),
			),
	},
	followRequests: {
		list: oc
			.route({
				method: 'GET',
				path: '/follow-requests',
			})
			.input(
				z.object({
					status: FollowRequestStatusSchema.optional(),
					limit: z.number().int().min(1).max(100).default(50),
					offset: z.number().int().min(0).default(0),
				}),
			)
			.output(
				z.object({
					requests: z.array(FollowRequestItemSchema),
					total: z.number().int().min(0),
				}),
			),
		update: oc
			.route({
				method: 'POST',
				path: '/follow-requests/{id}',
			})
			.input(
				z.object({
					id: z.string().min(1),
					status: z.enum(['approved', 'rejected']),
				}),
			)
			.output(
				z.object({
					success: z.boolean(),
				}),
			),
	},
	domainRules: {
		list: oc
			.route({
				method: 'GET',
				path: '/domain-rules',
			})
			.input(
				z.object({
					limit: z.number().int().min(1).max(100).default(50),
					offset: z.number().int().min(0).default(0),
				}),
			)
			.output(
				z.object({
					rules: z.array(DomainRuleSchema),
					total: z.number().int().min(0),
				}),
			),
		add: oc
			.route({
				method: 'POST',
				path: '/domain-rules',
			})
			.input(
				z.object({
					pattern: z.string().min(1),
					isRegex: z.boolean().default(false),
					reason: z.string().optional(),
				}),
			)
			.output(
				z.object({
					id: z.number().int().positive(),
					success: z.boolean(),
				}),
			),
		remove: oc
			.route({
				method: 'DELETE',
				path: '/domain-rules/{id}',
			})
			.input(
				z.object({
					id: z.coerce.number().int().positive(),
				}),
			)
			.output(
				z.object({
					success: z.boolean(),
				}),
			),
	},
};
