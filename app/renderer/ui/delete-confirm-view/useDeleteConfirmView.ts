import { useEventBus } from "./event-bus.ts";

const REJECT_EVENT = "reject_delete_confirm_view";

const RESOLVE_EVENT = "resolve_delete_confirm_view";

export function useCreateDeleteConfirmView() {
  const eventBus = useEventBus();

  function onReject() {
    eventBus.emit(REJECT_EVENT);
  }

  function onResolve() {
    eventBus.emit(RESOLVE_EVENT);
  }

  return { onReject, onResolve };
}

export function useDeleteConfirmView() {
  const uiState = uiStateService.useState();
  const eventBus = useEventBus();
  function confirm() {
    uiState.deleteConfirmShown = true;
    return new Promise((resolve, reject) => {
      eventBus.on(RESOLVE_EVENT, () => {
        resolve("confirm delete confirm view");
        uiState.deleteConfirmShown = false;
      });
      eventBus.on(REJECT_EVENT, () => {
        reject("cancel delete confirm view");
        uiState.deleteConfirmShown = false;
      });
    }).finally(() => {
      eventBus.all.clear();
    });
  }
  return { confirm };
}
