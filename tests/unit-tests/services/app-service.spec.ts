import os from "os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APPService } from "@/renderer/services/app-service";
import { PreferenceService } from "@/renderer/services/preference-service";

vi.mock("@/services/preference-service", () => {
  const PreferenceService = vi.fn();
  const IPreferenceService = vi.fn();

  return { PreferenceService, IPreferenceService };
});

describe("State Service", () => {
  let preferenceService: PreferenceService;

  beforeEach(() => {
    preferenceService = new PreferenceService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("State Service", () => {
    const appService = new APPService(preferenceService);
    expect(appService).toBeDefined();

    expect(appService.platform()).toBe(os.platform());
  });
});
