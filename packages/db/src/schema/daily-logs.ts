import { pgTable, serial, boolean, integer, uuid, date, text, timestamp, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { selectedActions } from './selected-actions';
import { userDays } from './user-days';
import { users } from './users';

export const dailyActionsLog = pgTable('daily_actions_log', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }),
  selectedActionId: integer('selected_action_id').notNull().references(() => selectedActions.id, {
    onDelete: 'cascade'
  }),
  userDayId: integer('user_day_id').references(() => userDays.id, {
    onDelete: 'set null'
  }),
  logDate: date('log_date').notNull(),
  status: boolean('status'),
  parentStatus: boolean('parent_status'),
  outcome: text('outcome').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Unique index
  uniqueIndex('daily_actions_log_unique_valid_entry')
    .on(table.userId, table.selectedActionId, table.logDate),

  // Check constraint
  check('daily_actions_log_outcome_check', 
    sql`outcome IN ('positive', 'negative', 'neutral')`
  ),
]);

export type DailyActionsLog = typeof dailyActionsLog.$inferSelect;
export type NewDailyActionsLog = typeof dailyActionsLog.$inferInsert; 