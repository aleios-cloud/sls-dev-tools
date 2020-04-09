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
    height: 10,
    left: 'right',
    top: 'center',
    keys: true,
    fg: 'green',
    interactive: true,
    items: ['loading'],
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
    content: 'ESC to close        ',
  });

  updateRegistryTable(api, registryTable);
  registryTable.focus();

  registryTable.key(['escape'], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventRegistryModal,
};
