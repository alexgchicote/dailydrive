import { pgTable, uuid, varchar, timestamp, text, boolean, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  color: varchar('color', { length: 7 }), // hex color code
  icon: varchar('icon', { length: 50 }),
  targetFrequency: integer('target_frequency').notNull().default(1), // times per day
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert; 