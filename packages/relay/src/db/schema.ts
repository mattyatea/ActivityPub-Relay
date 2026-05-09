import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const actors = sqliteTable('actors', {
	id: text('id').primaryKey(),
	inbox: text('inbox').notNull(),
	sharedInbox: text('sharedInbox'),
	publicKey: text('publicKey'),
});

export const followRequests = sqliteTable('followRequest', {
	id: text('id').primaryKey(),
	actor: text('actor'),
	object: text('object'),
	activityJson: text('activity_json'),
});

export const domainRules = sqliteTable('domainRules', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	pattern: text('pattern').notNull(),
	isRegex: integer('is_regex').notNull().default(0),
	createdAt: integer('created_at').notNull().default(0),
	reason: text('reason'),
});

export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
});

export type Actor = typeof actors.$inferSelect;
export type FollowRequest = typeof followRequests.$inferSelect;
export type DomainRule = typeof domainRules.$inferSelect;
export type Setting = typeof settings.$inferSelect;
