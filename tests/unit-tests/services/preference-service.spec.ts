import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { PreferenceService } from "@/renderer/services/preference-service";

describe("State Service", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  it("Preference Service", () => {
    const preferenceService = new PreferenceService();
    expect(preferenceService).toBeDefined();
    const version = preferenceService.get("preferenceVersion");

    expect(version).toBe(1);
  });
});
