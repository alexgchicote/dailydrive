import { pgTable, serial, uuid, date, jsonb, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userDailyJournals = pgTable('user_daily_journals', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }),
  logDate: date('log_date').notNull(),
  content: jsonb('content').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Unique constraint on user_id and log_date
  unique().on(table.userId, table.logDate),
  
  // Index for efficient lookups
  index('idx_user_daily_journals_user_id_log_date')
    .on(table.userId, table.logDate),
]);

export type UserDailyJournal = typeof userDailyJournals.$inferSelect;
export type NewUserDailyJournal = typeof userDailyJournals.$inferInsert;