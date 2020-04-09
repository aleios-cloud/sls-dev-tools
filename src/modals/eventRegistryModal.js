import { eventSchemaModal } from './eventSchemaModal';

function updateRegistryTable(api, table) {
  api.listRegistries({ Scope: 'LOCAL' }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const registries = [];
      data.Registries.forEach((r) => registries.push(r.RegistryName));
      table.setItems(registries);
    }
  });
}

const eventRegistryModal = (screen, blessed, eventBridge, application, api) => {
  const eventRegistryLayout = blessed.layout({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 112,
    height: 27,
    border: 'line',
    style: { border: { fg: 'green' } },
    keys: true,
    grabKeys: true,
  });

  const closeModal = () => {
    // Store all text to populate modal when next opened
    application.setIsModalOpen(false);
    application.returnFocus();
    eventRegistryLayout.destroy();
  };

  blessed.box({
    parent: eventRegistryLayout,
    width: 110,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    style: { fg: 'green' },
    content: 'Event Registry',
  });

  const registryTable = blessed.list({
    parent: eventRegistryLayout,
    width: 110,
    height: 20,
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    padding: { left: 2, right: 2 },
    left: 'right',
    top: 'center',
    keys: true,
    interactive: true,
    items: ['loading'],
    invertSelected: true,
    label: 'Registries',
  });

  blessed.box({
    parent: eventRegistryLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    content: 'Arrow keys to navigate | ENTER to select \nESC to close        ',
  });

  updateRegistryTable(api, registryTable);
  registryTable.focus();

  registryTable.key(['enter'], () => {
    const registry = registryTable.ritems[registryTable.selected];
    eventRegistryLayout.destroy();
    return eventSchemaModal(screen, blessed, eventBridge, application, api, registry);
  });

  registryTable.key(['escape'], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventRegistryModal,
};
