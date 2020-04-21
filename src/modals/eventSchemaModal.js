import { eventModal } from "./eventModal";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

function updateSchemaTable(api, registry, table) {
  api.listSchemas({ RegistryName: registry }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const schemas = [];
      data.Schemas.forEach((s) => schemas.push(s.SchemaName));
      table.setItems(schemas);
    }
  });
}

const eventSchemaModal = (
  screen,
  blessed,
  eventBridge,
  application,
  api,
  registry,
  injectEvent
) => {
  const eventSchemaLayout = new ModalLayout(screen, 112, 27, true);

  const closeModal = () => {
    // Store all text to populate modal when next opened
    application.setIsModalOpen(false);
    application.returnFocus();
    eventSchemaLayout.destroy();
  };

  new ModalTitle(eventSchemaLayout, 110, "Event Schemas");

  const schemaTable = blessed.list({
    parent: eventSchemaLayout,
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
    label: "Schemas",
  });

  new Box(
    eventSchemaLayout,
    110,
    4,
    "Arrow keys to navigate | ENTER to select \nESC to close"
  );

  updateSchemaTable(api, registry, schemaTable);
  schemaTable.focus();

  schemaTable.key(["enter"], () => {
    const schema = schemaTable.ritems[schemaTable.selected];
    eventSchemaLayout.destroy();
    return eventModal(
      screen,
      blessed,
      eventBridge,
      application,
      api,
      registry,
      schema,
      injectEvent
    );
  });

  schemaTable.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventSchemaModal,
};
