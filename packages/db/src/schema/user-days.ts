import { pgTable, serial, uuid, date, real, timestamp, smallint, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const userDays = pgTable('user_days', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }),
  logDate: date('log_date').notNull(),
  actionsDayGrade: real('actions_day_grade').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  numEngageActionsTotal: smallint('num_engage_actions_total').notNull(),
  numEngageActionsPositive: smallint('num_engage_actions_positive').notNull(),
  numEngageActionsNeutral: smallint('num_engage_actions_neutral').notNull(),
  numAvoidActionsTotal: smallint('num_avoid_actions_total').notNull(),
  numAvoidActionsPositive: smallint('num_avoid_actions_positive').notNull(),
  numCategoriesTracked: smallint('num_categories_tracked').notNull(),
  numEngageActionsNegative: smallint('num_engage_actions_negative').notNull(),
  numAvoidActionsNegative: smallint('num_avoid_actions_negative').notNull(),
}, (table) => [
  // Unique index
  uniqueIndex('user_days_unique_valid_entry')
    .on(table.userId, table.logDate),

  // All check constraints using raw SQL literals to avoid parameterization
  check('user_days_num_avoid_actions_total_check', 
    sql`num_avoid_actions_total >= 0`
  ),

  check('user_days_num_categories_tracked_check', 
    sql`num_categories_tracked >= 0`
  ),

  check('user_days_num_engage_actions_negative_check', 
    sql`num_engage_actions_negative >= 0`
  ),

  check('user_days_num_avoid_actions_negative_check', 
    sql`num_avoid_actions_negative >= 0`
  ),

  check('user_days_num_engage_actions_positive_check', 
    sql`num_engage_actions_positive >= 0`
  ),

  check('user_days_num_engage_actions_total_check', 
    sql`num_engage_actions_total >= 0`
  ),

  check('user_days_num_engage_actions_neutral_check', 
    sql`num_engage_actions_neutral >= 0`
  ),

  check('user_days_num_avoid_actions_positive_check', 
    sql`num_avoid_actions_positive >= 0`
  ),
]);

export type UserDay = typeof userDays.$inferSelect;
export type NewUserDay = typeof userDays.$inferInsert; 