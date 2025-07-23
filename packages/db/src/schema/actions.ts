import { pgTable, serial, integer, text, timestamp, uuid, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

// Actions Categories Table - Using proper Drizzle syntax from docs
export const actionsCategories = pgTable('actions_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('predefined'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdById: uuid('created_by_id').references(() => users.id, {
    onUpdate: 'cascade',
    onDelete: 'cascade'
  })
}, (table) => [
  // Unique indexes using proper syntax
  uniqueIndex('idx_predefined_categories_unique_name')
    .on(table.name)
    .where(sql`type = 'predefined'`),
  
  uniqueIndex('idx_custom_categories_unique_per_user')
    .on(table.createdById, table.name)
    .where(sql`type = 'custom'`),

  // Check constraints using raw SQL literals to avoid parameterization
  check('actions_categories_category_type_check', 
    sql`type IN ('predefined', 'custom')`
  ),
  
  check('actions_categories_custom_must_have_creator_check',
    sql`(type <> 'custom') OR (created_by_id IS NOT NULL)`
  ),
]);

// Actions List Table
export const actionsList = pgTable('actions_list', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => actionsCategories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  intent: text('intent').notNull(),
  type: text('type').notNull().default('predefined'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdById: uuid('created_by_id').references(() => users.id, {
    onUpdate: 'cascade',
    onDelete: 'cascade'
  })
}, (table) => [
  // Unique indexes
  uniqueIndex('idx_predefined_actions_unique_name')
    .on(table.name)
    .where(sql`type = 'predefined'`),
  
  uniqueIndex('idx_custom_actions_unique_per_user')
    .on(table.createdById, table.name)
    .where(sql`type = 'custom'`),

  // Check constraints using raw SQL literals to avoid parameterization
  check('actions_list_intent_check', 
    sql`intent IN ('engage', 'avoid')`
  ),

  check('actions_list_action_type_check', 
    sql`type IN ('predefined', 'custom')`
  ),

  check('actions_list_custom_must_have_creator_check',
    sql`(type <> 'custom') OR (created_by_id IS NOT NULL)`
  ),
]);

// Type exports
export type ActionsCategory = typeof actionsCategories.$inferSelect;
export type NewActionsCategory = typeof actionsCategories.$inferInsert;
export type ActionsList = typeof actionsList.$inferSelect;
export type NewActionsList = typeof actionsList.$inferInsert;