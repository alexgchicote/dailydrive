import { pgTable, uuid, timestamp, date, text, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { actions } from './actions';

export const actionCompletions = pgTable('action_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actionId: uuid('action_id').notNull().references(() => actions.id, { onDelete: 'cascade' }),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
  date: date('date').notNull(),
  notes: text('notes'),
  value: integer('value').default(1), // for quantifiable actions
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ActionCompletion = typeof actionCompletions.$inferSelect;
export type NewActionCompletion = typeof actionCompletions.$inferInsert; 