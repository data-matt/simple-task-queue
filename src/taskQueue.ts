import { PrismaClient } from "@prisma/client";
import { Task, taskRegistry, TASK_STATUS } from "./types";

export class TaskQueue {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async addTask(task: Task, delayMs: number = 0) {
    const maturityAt = new Date(Date.now() + delayMs);

    if (taskRegistry.isUnique(task.type)) {
      const existingTask = await this.prisma.task.findFirst({
        where: {
          payload: {
            path: ["type"],
            equals: task.type,
          },
        },
      });
      if (existingTask) {
        console.log(`Skipping duplicate task: ${task.type}`);
        return null;
      }
    }

    return await this.prisma.task.create({
      data: {
        type: task.type,
        priority: task.priority,
        maturityAt,
        payload: JSON.parse(JSON.stringify(task)),
      },
    });
  }

  async getNextBatchToProcess(batchSize: number = 10) {
    return await this.prisma.$transaction(async (tx) => {
      const tasks = await tx.$queryRaw`
        DELETE FROM "Task" 
        WHERE id IN (
          SELECT id 
          FROM "Task" 
          WHERE "maturityAt" < NOW()
          ORDER BY priority DESC, "createdAt" ASC 
          LIMIT ${batchSize}
          FOR UPDATE SKIP LOCKED
        ) 
        RETURNING *;
      `;
      return tasks as any[];
    });
  }

  async addBatchTasks(tasks: Task[], spacingMs: number = 0) {
    const results = [];
    for (let i = 0; i < tasks.length; i++) {
      const delay = i * spacingMs;
      const result = await this.addTask(tasks[i], delay);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  async close() {
    await this.prisma.$disconnect();
  }
}
