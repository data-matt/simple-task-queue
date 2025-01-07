import { TaskQueue } from "./taskQueue";
import { taskRegistry } from "./types";
import "./tasks"; // Import to register all tasks

class TaskScheduler {
  private queue: TaskQueue;
  private isRunning: boolean = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.queue = new TaskQueue();
  }

  private async scheduleTask(type: string) {
    const task = taskRegistry.build(type);
    if (!task) return;

    const scheduleNextRun = async () => {
      if (!this.isRunning) return;

      try {
        await this.queue.addTask(task);
        console.log(`📅 Scheduled task: ${type}`);
      } catch (error) {
        console.error(`Error scheduling task ${type}:`, error);
      }
    };

    // Initial run
    await scheduleNextRun();

    // Schedule recurring runs
    const frequency = taskRegistry.getTimedTasks().get(type);
    if (frequency) {
      const interval = setInterval(scheduleNextRun, frequency);
      this.intervals.push(interval);
    }
  }

  async start() {
    this.isRunning = true;
    console.log("🕒 Task scheduler started");

    // Start all registered tasks
    const timedTasks = taskRegistry.getTimedTasks();
    await Promise.all(
      Array.from(timedTasks.keys()).map((type) => this.scheduleTask(type))
    );
  }

  async stop() {
    this.isRunning = false;
    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
    await this.queue.close();
    console.log("👋 Task scheduler stopped");
  }
}

// Start the scheduler if this file is run directly
if (require.main === module) {
  const scheduler = new TaskScheduler();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Received SIGINT. Gracefully shutting down...");
    await scheduler.stop();
    process.exit(0);
  });

  scheduler.start().catch((error) => {
    console.error("Fatal error in task scheduler:", error);
    process.exit(1);
  });
}
