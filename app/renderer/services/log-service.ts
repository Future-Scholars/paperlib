import * as loglib from "electron-log";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";

interface ILogMessage {
  level: "info" | "warn" | "error";
  msg: string;
  additional?: string;
}

interface ILogGroup {
  id: string;
  lastlog: ILogMessage;
  lastTime: number;
}

export interface ILogEventState {
  infoLogMessage: {
    id: string;
    msg: string;
    additional?: string;
  };
  warnLogMessage: {
    id: string;
    msg: string;
    additional?: string;
  };
  errorLogMessage: {
    id: string;
    msg: string;
    additional?: string;
  };
  progressLogMessage: {
    id: string;
    progressId: string;
    msg: string;
    value: number;
  };
}

export const ILogService = createDecorator("logService");

export class LogService extends Eventable<ILogEventState> {
  private logGroups: { [key: string]: ILogGroup };

  constructor(name?: string) {
    super("logService", {
      infoLogMessage: {
        id: "",
        msg: "",
        additional: "",
      },
      warnLogMessage: {
        id: "",
        msg: "",
        additional: "",
      },
      errorLogMessage: {
        id: "",
        msg: "",
        additional: "",
      },
      progressLogMessage: {
        id: "",
        progressId: "",
        msg: "",
        value: 0,
      },
    });

    if (name) {
      const folder = loglib.transports.file
        .getFile()
        .path.split("/")
        .slice(0, -1)
        .join("/");
      loglib.transports.file.resolvePath = () => `${folder}/${name}`;
    }

    if (process.env.NODE_ENV === "test") {
      // disable console output for tests
      loglib.transports.console.level = false;
    }

    this.logGroups = {};
  }

  /**
   * Log info to the console and the log file.
   * @param {string} level - Log level
   * @param {string} msg - Message to log
   * @param {string} additional - Additional message to log
   * @param {boolean} notify - Show notification
   * @param {string?} id - ID of the log */
  log(
    level: "info" | "warn" | "error",
    msg: string,
    additional: string = "",
    notify: boolean = false,
    id?: string
  ) {
    switch (level) {
      case "info":
        this.info(msg, additional, notify, id);
        break;
      case "warn":
        this.warn(msg, additional, notify, id);
        break;
      case "error":
        this.error(msg, additional, notify, id);
        break;
      default:
        break;
    }
  }

  /**
   * Show log in the notification bar.
   * @param {LogMessage} logMessage - Log message
   * @param {string} id - ID of the log */
  _notifiy(logMessage: ILogMessage, id: string) {
    if (!(id in this.logGroups)) {
      this.logGroups[id] = {
        id: id,
        lastlog: {
          level: "info",
          msg: "",
        },
        lastTime: Date.now(),
      };
    }

    // Check duplicated log
    if (
      Date.now() - this.logGroups[id].lastTime < 500 &&
      this.logGroups[id].lastlog.level === logMessage.level &&
      this.logGroups[id].lastlog.msg === logMessage.msg &&
      this.logGroups[id].lastlog.additional === logMessage.additional
    ) {
      return;
    }

    this.logGroups[id].lastlog = logMessage;

    switch (logMessage.level) {
      case "info":
        this.fire({
          infoLogMessage: {
            id: id,
            msg: logMessage.msg,
            additional: logMessage.additional,
          },
        });
        break;
      case "warn":
        this.fire({
          warnLogMessage: {
            id: id,
            msg: logMessage.msg,
            additional: logMessage.additional,
          },
        });
        break;
      case "error":
        this.fire({
          errorLogMessage: {
            id: id,
            msg: logMessage.msg,
            additional: logMessage.additional,
          },
        });
        break;
      default:
        break;
    }
  }

  /**
   * Log info to the console and the log file.
   * @param {string} msg - Message to log
   * @param {string} additional - Additional message to log
   * @param {boolean} notify - Show notification
   * @param {string?} id - ID of the log */
  info(
    msg: string,
    additional: string = "",
    notify: boolean = false,
    id?: string
  ) {
    loglib.info(
      `${id ? `[${id}]` : ""} ${msg}${additional ? `: ${additional}` : ""}`
    );

    if (notify) {
      this._notifiy(
        {
          level: "info",
          msg: msg,
          additional: additional,
        },
        id || "default"
      );
    }
  }

  /**
   * Log warning to the console and the log file.
   * @param {string} msg - Message to log
   * @param {string} additional - Additional message to log
   * @param {boolean} notify - Show notification
   * @param {string?} id - ID of the log */
  warn(
    msg: string,
    additional: string = "",
    notify: boolean = false,
    id?: string
  ) {
    loglib.warn(
      `${id ? `[${id}]` : ""} ${msg}${additional ? `: ${additional}` : ""}`
    );
    if (notify) {
      this._notifiy(
        {
          level: "warn",
          msg: msg,
          additional: additional,
        },
        id || "default"
      );
    }
  }

  /**
   * Log error to the console and the log file.
   * @param {string} msg - Message to log
   * @param {string} additional - Additional message to log
   * @param {boolean} notify - Show notification
   * @param {string?} id - ID of the log */
  error(
    msg: string,
    additional: string | Error = "",
    notify: boolean = false,
    id?: string
  ) {
    loglib.error(
      `${id ? `[${id}]` : ""} ${msg}${
        typeof additional === "string" ? `: ${additional}` : ""
      }`
    );
    if (additional.hasOwnProperty("name")) {
      loglib.error((additional as Error).name);
    }
    if (additional.hasOwnProperty("stack")) {
      loglib.error((additional as Error).stack);
    }
    if (notify) {
      let additionalInfo = typeof additional === "string" ? additional : "";
      if (additional.hasOwnProperty("name")) {
        additionalInfo += `${(additional as Error).name}\n`;
      }
      if (additional.hasOwnProperty("stack")) {
        additionalInfo += `${(additional as Error).stack}`;
      }

      this._notifiy(
        {
          level: "error",
          msg: msg,
          additional: additionalInfo.slice(0, 100) + "...",
        },
        id || "default"
      );
    }
  }

  /**
   * Log progress to the console and the log file.
   * @param {string} msg - Message to log
   * @param {number} value - Progress value
   * @param {boolean} notify - Show notification
   * @param {string?} id - ID of the log */
  progress(
    msg: string,
    value: number,
    notify: boolean = false,
    id?: string,
    progressId?: string
  ) {
    loglib.info(`${id ? `[${id}]` : ""} ${msg} - ${value}%`);
    if (notify) {
      this.fire({
        progressLogMessage: {
          id: id || "default",
          progressId: progressId || "",
          msg: msg,
          value: value,
        },
      });
    }
  }

  /**
   * Get log file path.
   * @returns {string} Log file path */
  getLogFilePath(): string {
    return loglib.transports.file.getFile().path;
  }
}
