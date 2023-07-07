import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { StateService } from "@/renderer/services/state-service/state-service";

describe("State Service", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("State Service", () => {
    const stateService = new StateService();
    expect(stateService).toBeDefined();

    expect(stateService.viewState.searchText).toBe("");
    stateService.viewState.searchText = "abc";
    expect(stateService.viewState.searchText).toBe("abc");
  });
});
