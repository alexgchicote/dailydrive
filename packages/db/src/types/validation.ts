import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { 
  actionsCategories, 
  actionsList 
} from '../schema/actions';
import { selectedActions } from '../schema/selected-actions';
import { userDays } from '../schema/user-days';
import { dailyActionsLog } from '../schema/daily-logs';
import { userDailyJournals } from '../schema/user-day-journals';

// ✅ AUTO-GENERATED from Drizzle schemas - base validation
export const CreateActionsCategorySchema = createInsertSchema(actionsCategories);
export const UpdateActionsCategorySchema = CreateActionsCategorySchema.partial();
export const SelectActionsCategorySchema = createSelectSchema(actionsCategories);

export const CreateActionsListSchema = createInsertSchema(actionsList);
export const UpdateActionsListSchema = CreateActionsListSchema.partial();
export const SelectActionsListSchema = createSelectSchema(actionsList);

export const CreateSelectedActionSchema = createInsertSchema(selectedActions);
export const UpdateSelectedActionSchema = CreateSelectedActionSchema.partial();
export const SelectSelectedActionSchema = createSelectSchema(selectedActions);

export const CreateUserDaySchema = createInsertSchema(userDays);
export const UpdateUserDaySchema = CreateUserDaySchema.partial();
export const SelectUserDaySchema = createSelectSchema(userDays);

export const CreateDailyActionsLogSchema = createInsertSchema(dailyActionsLog);
export const UpdateDailyActionsLogSchema = CreateDailyActionsLogSchema.partial();
export const SelectDailyActionsLogSchema = createSelectSchema(dailyActionsLog);

export const CreateUserDailyJournalSchema = createInsertSchema(userDailyJournals);
export const UpdateUserDailyJournalSchema = CreateUserDailyJournalSchema.partial();
export const SelectUserDailyJournalSchema = createSelectSchema(userDailyJournals);

// ✅ Custom validation for specific business logic (these are manual)
export const CreateActionWithValidationSchema = CreateActionsListSchema.extend({
  categoryId: z.number().int().positive('Category ID must be positive'),
  actionName: z.string().min(1, 'Action name is required').max(255),
});

export const CreateUserDayWithValidationSchema = CreateUserDaySchema.extend({
  userId: z.string().uuid('Invalid user ID format'),
  dayScore: z.number().min(0).max(100).optional(),
  completionPercentage: z.number().min(0).max(100),
});

// Common validation schemas (these are still manual since they're not DB tables)
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).optional(),
});

export const SortSchema = z.object({
  column: z.string(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.startDate <= data.endDate, {
  message: 'Start date must be before or equal to end date',
});

// Export inferred types
export type CreateActionsCategoryInput = z.infer<typeof CreateActionsCategorySchema>;
export type UpdateActionsCategoryInput = z.infer<typeof UpdateActionsCategorySchema>;
export type SelectActionsCategoryInput = z.infer<typeof SelectActionsCategorySchema>;

export type CreateActionsListInput = z.infer<typeof CreateActionsListSchema>;
export type UpdateActionsListInput = z.infer<typeof UpdateActionsListSchema>;
export type SelectActionsListInput = z.infer<typeof SelectActionsListSchema>;

export type CreateSelectedActionInput = z.infer<typeof CreateSelectedActionSchema>;
export type UpdateSelectedActionInput = z.infer<typeof UpdateSelectedActionSchema>;
export type SelectSelectedActionInput = z.infer<typeof SelectSelectedActionSchema>;

export type CreateUserDayInput = z.infer<typeof CreateUserDaySchema>;
export type UpdateUserDayInput = z.infer<typeof UpdateUserDaySchema>;
export type SelectUserDayInput = z.infer<typeof SelectUserDaySchema>;

export type CreateDailyActionsLogInput = z.infer<typeof CreateDailyActionsLogSchema>;
export type UpdateDailyActionsLogInput = z.infer<typeof UpdateDailyActionsLogSchema>;
export type SelectDailyActionsLogInput = z.infer<typeof SelectDailyActionsLogSchema>;

export type CreateUserDailyJournalInput = z.infer<typeof CreateUserDailyJournalSchema>;
export type UpdateUserDailyJournalInput = z.infer<typeof UpdateUserDailyJournalSchema>;
export type SelectUserDailyJournalInput = z.infer<typeof SelectUserDailyJournalSchema>;

// Enhanced validation types
export type CreateActionWithValidationInput = z.infer<typeof CreateActionWithValidationSchema>;
export type CreateUserDayWithValidationInput = z.infer<typeof CreateUserDayWithValidationSchema>;

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SortInput = z.infer<typeof SortSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>; 