// Re-export all types from schema files
export type {
  User,
  NewUser,
  UserDay,
  NewUserDay,
  DailyActionsLog,
  NewDailyActionsLog,
  UserDailyJournal,
  NewUserDailyJournal,
  ActionsCategory,
  NewActionsCategory,
  ActionsList,
  NewActionsList,
  SelectedAction,
  NewSelectedAction,
} from '../schema';

// Re-export validation schemas and types
export * from './validation';

// Common database utilities
export type DatabaseError = {
  message: string;
  code?: string;
  details?: any;
};

export type PaginationOptions = {
  page?: number;
  limit?: number;
  offset?: number;
};

export type SortOrder = 'asc' | 'desc';

export type SortOptions<T> = {
  column: keyof T;
  order: SortOrder;
};

export type QueryOptions<T> = {
  pagination?: PaginationOptions;
  sort?: SortOptions<T>;
  filters?: Partial<T>;
}; 