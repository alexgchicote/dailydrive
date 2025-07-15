import { pgTable, uuid, timestamp, text, date, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const dailyLogs = pgTable('daily_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  journalEntry: text('journal_entry'),
  mood: integer('mood'), // 1-10 scale
  energy: integer('energy'), // 1-10 scale
  productivity: integer('productivity'), // 1-10 scale
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DailyLog = typeof dailyLogs.$inferSelect;
export type NewDailyLog = typeof dailyLogs.$inferInsert; 