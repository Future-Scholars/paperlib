import { expect, test } from "vitest";

import { PreferenceService } from "@/services/preference-service";

test("Preference Service", () => {
  const preferenceService = new PreferenceService();
  expect(preferenceService).toBeDefined();
  const version = preferenceService.get("preferenceVersion");

  expect(version).toBe(1);
});
