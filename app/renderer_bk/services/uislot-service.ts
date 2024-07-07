import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { ILogService, LogService } from "@/common/services/log-service";

export const IUIStateService = createDecorator("uiStateService");

export interface IUISlotState {
  paperDetailsPanelSlot1: {
    [id: string]: { title: string; content: string };
  };
  paperDetailsPanelSlot2: {
    [id: string]: { title: string; content: string };
  };
  paperDetailsPanelSlot3: {
    [id: string]: { title: string; content: string };
  };
  overlayNotifications: {
    [id: string]: { title: string; content: string };
  };
}

export class UISlotService extends Eventable<IUISlotState> {
  constructor(@ILogService private readonly _logService: LogService) {
    super("uiSlotService", {
      paperDetailsPanelSlot1: {},
      paperDetailsPanelSlot2: {},
      paperDetailsPanelSlot3: {},
      overlayNotifications: {},
    });
  }

  /**
   * Update a slot with the given patch
   * @param slotID - The slot to update
   * @param patch - The patch to apply to the slot
   * @returns
   */
  updateSlot(slotID: keyof IUISlotState, patch: { [id: string]: any }) {
    const currentSlot = JSON.parse(JSON.stringify(this.getState(slotID)));

    if (!currentSlot) {
      this._logService.error(
        `Slot does not exist in UISlotService.`,
        slotID,
        true,
        "UISlotService"
      );
      return;
    }

    for (const [sectionID, value] of Object.entries(patch)) {
      if (value === undefined) {
        delete currentSlot[sectionID];
      } else {
        currentSlot[sectionID] = value;
      }
    }

    this.fire({ [slotID]: currentSlot });
  }

  /**
   * Delete an item from a slot
   * @param slotID - The slot to delete from
   * @param itemID - The item to delete
   * @returns
   */
  deleteSlotItem(slotID: keyof IUISlotState, itemID: string) {
    const currentSlot = JSON.parse(JSON.stringify(this.getState(slotID)));

    if (!currentSlot) {
      this._logService.error(
        `Slot does not exist in UISlotService.`,
        slotID,
        true,
        "UISlotService"
      );
      return;
    }

    delete currentSlot[itemID];

    this.fire({ [slotID]: currentSlot });
  }
}
