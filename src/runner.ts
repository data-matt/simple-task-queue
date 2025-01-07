import { TaskQueue } from "./taskQueue";
import { Task, TASK_STATUS, taskRegistry } from "./types";
import "./tasks"; // Import to register all tasks

class TaskRunner {
  private queue: TaskQueue;
  private isRunning: boolean = false;

  constructor() {
    this.queue = new TaskQueue();
  }

  async processTask(taskData: any): Promise<TASK_STATUS> {
    const task = taskRegistry.build(taskData.payload.type, taskData.payload);
    if (!task) {
      console.error(`No task type registered for: ${taskData.payload.type}`);
      return TASK_STATUS.FAILURE;
    }

    try {
      const result = await task.run();

      if (result === TASK_STATUS.FAILURE) {
        const nextTryDelay = task.nextTry();
        if (nextTryDelay >= 0) {
          task.tries += 1;
          await this.queue.addTask(task, nextTryDelay);
          console.log(
            `Scheduled retry for task ${task.type} in ${nextTryDelay}ms`
          );
        }
      }

      return result;
    } catch (error) {
      console.error(`Error processing task ${task.type}:`, error);
      return TASK_STATUS.FAILURE;
    }
  }

  async start() {
    this.isRunning = true;
    console.log("🚀 Task runner started");

    while (this.isRunning) {
      try {
        const tasks = await this.queue.getNextBatchToProcess(5);

        if (tasks.length === 0) {
          // No tasks available, wait before next poll
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        await Promise.all(tasks.map((task) => this.processTask(task)));
      } catch (error) {
        console.error("Error in task runner:", error);
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async stop() {
    this.isRunning = false;
    await this.queue.close();
    console.log("👋 Task runner stopped");
  }
}

// Start the runner if this file is run directly
if (require.main === module) {
  const runner = new TaskRunner();

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Received SIGINT. Gracefully shutting down...");
    await runner.stop();
    process.exit(0);
  });

  runner.start().catch((error) => {
    console.error("Fatal error in task runner:", error);
    process.exit(1);
  });
}
