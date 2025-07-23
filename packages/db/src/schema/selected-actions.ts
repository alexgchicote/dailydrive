import { pgTable, serial, integer, uuid, date, boolean, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { actionsList } from './actions';
import { users } from './users';

export const selectedActions = pgTable('selected_actions', {
  id: serial('id').primaryKey(),
  
  userId: uuid('user_id').notNull().references(() => users.id, {
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }),
  
  actionId: integer('action_id').notNull().references(() => actionsList.id, { 
    onDelete: 'cascade' 
  }),
  addedToTrackingAt: date('added_to_tracking_at').notNull(),
  removedFromTrackingAt: date('removed_from_tracking_at'),
  groupCategory: boolean('group_category').default(false),
}, (table) => [
  // Unique index for active selected actions
  uniqueIndex('unique_active_selected_action')
    .on(table.userId, table.actionId)
    .where(sql`removed_from_tracking_at IS NULL`),

  // Check constraint for valid date range
  check('selected_actions_check', 
    sql`(removed_from_tracking_at IS NULL) OR (removed_from_tracking_at >= added_to_tracking_at)`
  ),
]);

export type SelectedAction = typeof selectedActions.$inferSelect;
export type NewSelectedAction = typeof selectedActions.$inferInsert;

// Note: This table also has a trigger created via migration:
// CREATE TRIGGER validate_selected_action_access_trigger 
//   BEFORE INSERT OR UPDATE ON selected_actions 
//   FOR EACH ROW 
//   EXECUTE FUNCTION validate_selected_action_access();