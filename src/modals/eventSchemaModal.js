import { eventModal } from "./eventModal";

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
  const eventSchemaLayout = blessed.layout({
    parent: screen,
    top: "center",
    left: "center",
    width: 112,
    height: 27,
    border: "line",
    style: { border: { fg: "green" } },
    keys: true,
    grabKeys: true,
  });

  const closeModal = () => {
    // Store all text to populate modal when next opened
    application.setIsModalOpen(false);
    application.returnFocus();
    eventSchemaLayout.destroy();
  };

  blessed.box({
    parent: eventSchemaLayout,
    width: 110,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    style: { fg: "green" },
    content: "Event Schemas",
  });

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

  blessed.box({
    parent: eventSchemaLayout,
    width: 110,
    height: 4,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "green", border: { fg: "green" } },
    content: "Arrow keys to navigate | ENTER to select \nESC to close        ",
  });

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
