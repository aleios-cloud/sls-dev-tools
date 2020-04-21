import { eventSchemaModal } from "./eventSchemaModal";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

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

const eventRegistryModal = (
  screen,
  blessed,
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

  const registryTable = blessed.list({
    parent: eventRegistryLayout,
    width: 110,
    height: 20,
    border: "line",
    style: { fg: "green", border: { fg: "green" } },
    padding: { left: 2, right: 2 },
    left: "right",
    top: "center",
    keys: true,
    interactive: true,
    items: ["loading"],
    invertSelected: true,
    label: "Registries",
  });

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
      blessed,
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

module.exports = { eventRegistryModal };
