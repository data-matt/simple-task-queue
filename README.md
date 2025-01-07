# Task Queue with PostgreSQL SKIP LOCKED

This repository demonstrates how to build an efficient task queue using PostgreSQL's `FOR UPDATE SKIP LOCKED` feature, providing row-level locking for parallel task processing without contention. This is the companion code for the blog post [Simplifying Task Queues with PostgreSQL](https://blog.gentrace.ai/task-queue-simplification).

## Features

- Task scheduling with priorities and delays
- Automatic retries with configurable intervals
- Unique task constraints
- Scheduled (recurring) tasks
- Graceful shutdown handling
- Parallel task processing with SKIP LOCKED

## Example Tasks

- `SendEmail`: Simple email task simulation
- `ProcessData`: Data processing task simulation
- `DailyReport`: Daily scheduled task (unique, runs every 24 hours)
- `HealthCheck`: High-priority health check (unique, runs every 5 seconds, with retries)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL:

```bash
docker-compose up -d
```

3. Initialize the database:

```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate  # Create database tables
```

4. Start the task system:

```bash
# Start both runner and scheduler
npm run start:all

# Or start them separately:
npm run start:runner    # Terminal 1
npm run start:scheduler # Terminal 2
```

## Architecture

- `src/types.ts`: Core task system types and registry
- `src/tasks.ts`: Task implementations using decorators
- `src/taskQueue.ts`: PostgreSQL-based queue operations
- `src/runner.ts`: Task execution and retry logic
- `src/scheduler.ts`: Scheduled task management

## Database Schema

The system uses a simple PostgreSQL table:

```sql
CREATE TABLE "Task" (
  id         String   @id @default(uuid())
  type       String
  priority   Int      @default(100)
  payload    Json
  maturityAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
)
```

## Environment

Required environment variables (see `.env.example`):

```
DATABASE_URL="postgresql://taskuser:taskpass@localhost:6000/taskdb"
```

## Development

1. Create a new task:

```typescript
@RegisterTask("MyTask", frequency?, { unique?: boolean })
export class MyTask extends Task {
  constructor() {
    super("MyTask", priority);
  }

  async run(): Promise<TASK_STATUS> {
    // Implementation
  }
}
```

2. Add retry logic:

```typescript
nextTry(): number {
  return this.tries < 3 ? 60 * 1000 : -1; // Retry 3 times with 1-minute delay
}
```
