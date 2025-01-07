export enum TASK_STATUS {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  IGNORED = "IGNORED",
}

export type TaskConfig = {
  unique?: boolean;
  retryCount?: number;
};

export abstract class Task {
  tries = 0;
  type: string;
  createdAt: number;
  priority: number;

  protected constructor(type: string, priority = 100) {
    this.type = type;
    this.createdAt = Date.now();
    this.priority = priority;
  }

  nextTry(): number {
    return -1;
  }

  abstract run(): Promise<TASK_STATUS>;
}

class TaskRegistry {
  private types = new Map<string, { new (): Task }>();
  private frequencies = new Map<string, number>();
  private uniqueTasks = new Set<string>();

  register<T extends Task>(
    typeStr: string,
    type: { new (): T },
    frequency?: number,
    options?: { unique?: boolean }
  ) {
    this.types.set(typeStr, type);
    if (frequency) {
      this.frequencies.set(typeStr, frequency);
    }
    if (options?.unique) {
      this.uniqueTasks.add(typeStr);
    }
  }

  build<T extends Task>(typeStr: string, data: Partial<T> = {}) {
    const type = this.types.get(typeStr);
    if (!type) {
      return null;
    }
    const task = new type() as T;
    Object.assign(task, data);
    return task;
  }

  getTimedTasks() {
    return new Map(this.frequencies);
  }

  isUnique(type: string): boolean {
    return this.uniqueTasks.has(type);
  }
}

export const taskRegistry = new TaskRegistry();

export function RegisterTask(
  typeStr: string,
  frequency?: number,
  options?: { unique?: boolean }
) {
  return (type: { new (): Task }) => {
    taskRegistry.register(typeStr, type, frequency, options);
  };
}
