import { eventSchemaModal } from "./eventSchemaModal";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";
import { InteractiveList } from "../components/interactiveList";

function updateRegistryTable(api, table) {
  api.listRegistries({ Scope: "LOCAL" }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const registries = [];
      data.Registries.forEach((r) => registries.push(r.RegistryName));
      table.setItems(registries);
    }
  });
}

export const eventRegistryModal = (
  screen,
  eventBridge,
  application,
  api,
  injectEvent
) => {
  const eventRegistryLayout = new ModalLayout(screen, 112, 27, true);

  const closeModal = () => {
    // Store all text to populate modal when next opened
    application.setIsModalOpen(false);
    application.returnFocus();
    eventRegistryLayout.destroy();
  };

  new ModalTitle(eventRegistryLayout, 110, "Event Registry");

  const registryTable = new InteractiveList(
    eventRegistryLayout,
    110,
    20,
    "Registries"
  );

  new Box(
    eventRegistryLayout,
    110,
    4,
    "Arrow keys to navigate | ENTER to select \nESC to close"
  );

  updateRegistryTable(api, registryTable);
  registryTable.focus();

  registryTable.key(["enter"], () => {
    const registry = registryTable.ritems[registryTable.selected];
    eventRegistryLayout.destroy();
    return eventSchemaModal(
      screen,
      eventBridge,
      application,
      api,
      registry,
      injectEvent
    );
  });

  registryTable.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};
