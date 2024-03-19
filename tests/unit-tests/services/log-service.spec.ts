import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { expect, test } from "vitest";

import { LogService } from "@/common/services/log-service";

test("Log Service", () => {
  const logService = new LogService("unit-test.log");

  expect(logService).toBeDefined();

  const logFilePath = logService.getLogFilePath();

  if (existsSync(logFilePath)) {
    unlinkSync(logFilePath);
  }

  logService.info("A");
  logService.warn("B");
  logService.error("C");
  logService.progress("D", 50);

  expect(existsSync(logFilePath)).toBe(true);

  const logFileContent = readFileSync(logFilePath, "utf-8");

  expect(logFileContent).toContain("[info]   A");
  expect(logFileContent).toContain("[warn]   B");
  expect(logFileContent).toContain("[error]  C");
  expect(logFileContent).toContain("[info]   D - 50%");
});
