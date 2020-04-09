function updateEvent(api, registry, schema, textbox) {
  api.describeSchema({ RegistryName: registry, SchemaName: schema }, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      console.log(data);
      const eventJson = data.Content;
      textbox.content = eventJson;
    }
  });
}

const eventModal = (screen, blessed, eventBridge, application, api, registry, schema) => {
  const eventLayout = blessed.layout({
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
    eventLayout.destroy();
  };

  blessed.box({
    parent: eventLayout,
    width: 110,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    style: { fg: 'green' },
    content: 'Event Injection',
  });

  const event = blessed.box({
    parent: eventLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    content: 'loading',
  });

  blessed.box({
    parent: eventLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    content: 'ESC to close',
  });

  updateEvent(api, registry, schema, event);

  eventLayout.focus();

  eventLayout.key(['escape'], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventModal,
};
