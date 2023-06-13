import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { StateService } from "@/services/state-service/state-service";

describe("State Service", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("State Service", () => {
    const stateService = new StateService();
    expect(stateService).toBeDefined();

    expect(stateService.viewState.processingQueueCount).toBe(0);
    stateService.viewState.processingQueueCount = 1;
    expect(stateService.viewState.processingQueueCount).toBe(1);
  });
});
