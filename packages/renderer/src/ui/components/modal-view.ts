import { createApp } from "vue";
import ConfirmationDialog from "./modal-view.vue";

export function createModalView(
  title: string,
  info: string,
  onConfirm: () => void,
  onCancel: () => void
) {
  const div = document.getElementById("modal-view") as HTMLDivElement;

  const dialog = createApp(ConfirmationDialog, {
    title: title,
    info: info,
    onConfirm: onConfirm,
    onCancel: onCancel,
  });
  dialog.mount(div);
  window.appInteractor.setState("viewState.isModalShown", "true");
}
