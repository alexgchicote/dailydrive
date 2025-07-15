// Re-export all types from schema files
export type {
  User,
  NewUser,
  Action,
  NewAction,
  DailyLog,
  NewDailyLog,
  ActionCompletion,
  NewActionCompletion,
} from './schema';

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

export type SortOptions = {
  field: string;
  direction: 'asc' | 'desc';
};

export type QueryOptions = {
  pagination?: PaginationOptions;
  sort?: SortOptions;
}; 