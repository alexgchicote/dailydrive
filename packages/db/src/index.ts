import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create the connection
const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

// Export the client for direct use if needed
export { client };

// Export schema tables and types
export * from './schema';

// Export query functions
export * from './queries/users';
export * from './queries/actions';

// Export service classes
export * from './services/user-service';
export * from './services/action-service'; 