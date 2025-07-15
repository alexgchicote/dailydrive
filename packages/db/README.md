# @dailydrive/db

Database package for the DailyDrive monorepo using Drizzle ORM with PostgreSQL.

## Structure

```
packages/db/
├── drizzle/           # Generated migration files and meta
├── src/
│   ├── schema/        # Database table definitions
│   ├── queries/       # Raw SQL query functions
│   ├── services/      # Business logic services
│   ├── types/         # TypeScript type definitions
│   ├── seed.ts        # Database seeding (safe)
│   └── index.ts       # Main exports
├── drizzle.config.ts  # Drizzle configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1. **Install dependencies**:
```bash
pnpm install
```

2. **Set up your environment variables**:
```bash
# Add to your .env file
DATABASE_URL=postgresql://username:password@localhost:5432/dailydrive
```

3. **Generate initial migration files**:
```bash
pnpm db:generate
```

4. **Run migrations** (SAFE - preserves existing data):
```bash
pnpm db:migrate
```

5. **Seed with sample data** (optional, skips if data exists):
```bash
pnpm db:seed
```

## Usage

### Import the database instance

```typescript
import { db } from '@dailydrive/db';
```

### Import types

```typescript
import { User, Action, DailyLog, ActionCompletion } from '@dailydrive/db';
```

### Use query functions

```typescript
import { getUserById, getActionsByUserId } from '@dailydrive/db';

const user = await getUserById('user-id');
const actions = await getActionsByUserId('user-id');
```

### Use service classes (recommended)

```typescript
import { UserService, ActionService } from '@dailydrive/db';

// High-level operations with built-in validation
const user = await UserService.findById('user-id');
const userWithActions = await UserService.getUserWithActions('user-id');

// Action management
const actions = await ActionService.findByUserId('user-id');
const progress = await ActionService.getDailyProgress('user-id', '2024-01-01');
```

## Scripts

### Safe Operations (Recommended)
- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Run migrations (preserves existing data)
- `pnpm db:seed` - Seed database with sample data (skips if exists)
- `pnpm db:studio` - Open Drizzle Studio for database inspection

### Development Operations
- `pnpm dev` - Watch mode for TypeScript compilation
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm type-check` - Type checking without emitting files
- `pnpm lint` - Run ESLint

### Dangerous Operations (Use with caution)
- `pnpm db:push` - Push schema directly to database (may lose data)
- `pnpm db:push:force` - Force push schema changes (WILL lose data)
- `pnpm db:drop` - Drop database tables (WILL lose ALL data)

## Database Schema

### Tables

- **users** - User accounts with authentication info
- **actions** - Habits/actions that users want to track
- **daily_logs** - Daily journal entries and mood tracking
- **action_completions** - Records of completed actions with timestamps

### Relationships

- Users have many Actions
- Users have many Daily Logs
- Users have many Action Completions
- Actions have many Action Completions

## Development Workflow

### Making Schema Changes

1. **Update schema files** in `src/schema/`
2. **Generate migration**:
   ```bash
   pnpm db:generate
   ```
3. **Review the generated migration** in `drizzle/`
4. **Run migration**:
   ```bash
   pnpm db:migrate
   ```

### Adding New Queries

1. Add query functions to appropriate file in `src/queries/`
2. Export from `src/index.ts`
3. Consider adding higher-level service methods

### Adding New Services

1. Create service class in `src/services/`
2. Export from `src/index.ts`
3. Include error handling and validation

## Data Safety

This package is designed with data safety in mind:

- **Migrations over Push**: Uses `db:migrate` by default, which preserves existing data
- **Safe Seeding**: Checks for existing data before seeding
- **Soft Deletes**: Actions are marked as inactive rather than deleted
- **Validation**: Service classes include validation and error handling

## Best Practices

1. **Always use migrations** in production
2. **Use service classes** for business logic
3. **Test schema changes** in development first
4. **Backup your database** before major changes
5. **Use type-safe queries** with Drizzle ORM 