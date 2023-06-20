import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";

import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/services/log-service";

export const ISchedulerService = createDecorator("schedulerService");

export class SchedulerService {
  private readonly _scheduler: ToadScheduler;

  constructor(@ILogService private readonly _logService: LogService) {
    this._scheduler = new ToadScheduler();
  }

  /**
   * Create a task.
   * @param taskId The id of the task.
   * @param taskImpl The implementation of the task.
   * @param interval The interval of the task.
   * @param errorImpl The implementation of the error handler.
   * @param runImmediately Whether to run the task immediately.
   * @param runOnce Whether to run the task only once. */
  createTask(
    taskId: string,
    taskImpl: () => void,
    interval: number,
    errorImpl?: (error: Error) => void,
    runImmediately: boolean = false,
    runOnce: boolean = false
  ) {
    const task = new Task(
      taskId,
      runOnce
        ? () => {
            taskImpl();
            this._scheduler.removeById(taskId);
          }
        : taskImpl,
      errorImpl
        ? errorImpl
        : (error: Error) => {
            this._logService.error(
              `Task ${taskId} failed.`,
              error,
              true,
              "SchedulerService"
            );
          }
    );

    const job = new SimpleIntervalJob(
      { seconds: interval, runImmediately: runImmediately },
      task,
      taskId
    );

    this._scheduler.addSimpleIntervalJob(job);

    this._logService.info(
      `Task ${taskId} created.`,
      `Interval ${interval} runImmediately ${runImmediately} runOnce ${runOnce}`,
      false,
      "SchedulerService"
    );
  }

  /**
   * Remove a task.
   * @param taskId The id of the task. */
  removeTask(taskId: string) {
    this._scheduler.removeById(taskId);
  }

  /**
   * Start a task.
   * @param taskId The id of the task. */
  startTask(taskId: string) {
    this._scheduler.startById(taskId);
  }

  /**
   * Stop a task.
   * @param taskId The id of the task. */
  stopTask(taskId: string) {
    this._scheduler.stopById(taskId);
  }
}
