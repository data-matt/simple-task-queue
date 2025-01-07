import { Task, TASK_STATUS, RegisterTask } from "./types";

@RegisterTask("SendEmail")
export class SendEmailTask extends Task {
  constructor() {
    super("SendEmail", 100);
  }

  async run(): Promise<TASK_STATUS> {
    console.log("📧 Processing SendEmail task");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return TASK_STATUS.SUCCESS;
  }
}

@RegisterTask("ProcessData")
export class ProcessDataTask extends Task {
  constructor() {
    super("ProcessData", 100);
  }

  async run(): Promise<TASK_STATUS> {
    console.log("🔄 Processing data task");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return TASK_STATUS.SUCCESS;
  }
}

@RegisterTask("DailyReport", 24 * 60 * 60 * 1000, { unique: true })
export class DailyReportTask extends Task {
  constructor() {
    super("DailyReport", 100);
  }

  async run(): Promise<TASK_STATUS> {
    console.log("📊 Generating daily report");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return TASK_STATUS.SUCCESS;
  }
}

@RegisterTask("HealthCheck", 5 * 1000, { unique: true })
export class HealthCheckTask extends Task {
  constructor() {
    super("HealthCheck", 200); // Higher priority for health checks
  }

  nextTry(): number {
    return this.tries < 3 ? 60 * 1000 : -1; // Retry after 1 minute, up to 3 times
  }

  async run(): Promise<TASK_STATUS> {
    console.log("💓 Running health check");
    const isHealthy = Math.random() > 0.1;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return isHealthy ? TASK_STATUS.SUCCESS : TASK_STATUS.FAILURE;
  }
}
