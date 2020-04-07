const eventInjectionModal = (screen, blessed, eventBridge, application, injectEvent) => {
  const eventInjectLayout = blessed.layout({
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

  // Prefill textbox with previous submission if there is one
  const event = application.previousSubmittedEvent[eventBridge]
    ? application.previousSubmittedEvent[eventBridge]
    : {
      EventBusName: eventBridge,
      DetailType: '',
      Source: '',
      Detail: '{}',
    };

  // String values textboxes are initialized with
  const preset = [event.EventBusName, event.DetailType, event.Source, event.Detail];

  const fields = ['EventBusName', 'DetailType', 'Source', 'Detail'];

  const numTextboxes = 4;

  let currentTextbox = 1;

  const textboxes = [];

  const unselectTextbox = (index) => {
    textboxes[index].style.border.fg = 'green';
    if (index === 4) {
      textboxes[index].style.fg = 'green';
    }
  };

  const selectTextbox = (index) => {
    textboxes[index].style.border.fg = 'yellow';
    if (index === 4) {
      textboxes[index].style.fg = 'yellow';
    }
  };

  const updateEventValues = () => {
    event.EventBusName = textboxes[0].getValue();
    event.DetailType = textboxes[1].getValue();
    event.Source = textboxes[2].getValue();
    event.Detail = textboxes[3].getValue();
  };

  const closeModal = () => {
    // Store all text to populate modal when next opened
    updateEventValues();
    application.previousSubmittedEvent[eventBridge] = event;
    application.setIsModalOpen(false);
    application.returnFocus();
    eventInjectLayout.destroy();
  };

  blessed.box({
    parent: eventInjectLayout,
    width: 110,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    style: { fg: 'green' },
    content: 'Event Injection',
  });

  for (let i = 0; i < numTextboxes; i += 1) {
    blessed.box({
      parent: eventInjectLayout,
      width: 110,
      left: 'right',
      top: 'center',
      align: 'left',
      padding: { left: 1, right: 1 },
      content: fields[i],
    });
    const textbox = blessed.textbox({
      parent: eventInjectLayout,
      top: 'center',
      left: 'center',
      border: 'line',
      pad: 2,
      width: 110,
      style: {
        border: { fg: 'green' },
        header: { fg: 'bright-green', bold: true, underline: true },
        cell: { fg: 'yellow' },
      },
      inputOnFocus: true,
      secret: false,
      censor: false,
      value: preset[i],
    });
    textbox.on('cancel', () => {
      updateEventValues();
      closeModal();
    });
    textboxes.push(textbox);
  }

  const submit = blessed.box({
    parent: eventInjectLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    content: 'Submit',
  });

  textboxes.push(submit);

  blessed.box({
    parent: eventInjectLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    content: 'Arrow keys to select field | ENTER to toggle edit mode \nENTER on Submit to inject event | ESC to close        ',
  });

  eventInjectLayout.focus();

  selectTextbox(currentTextbox);

  eventInjectLayout.key(['enter'], () => {
    // Inject event or select field for entry
    if (currentTextbox === 4) {
      updateEventValues();
      injectEvent(event);
      closeModal();
    } else {
      textboxes[currentTextbox].focus();
    }
  });
  eventInjectLayout.key(['up'], () => {
    unselectTextbox(currentTextbox);
    currentTextbox -= 1;
    if (currentTextbox === -1) {
      currentTextbox = 4;
    }
    selectTextbox(currentTextbox);
  });
  eventInjectLayout.key(['down'], () => {
    unselectTextbox(currentTextbox);
    currentTextbox += 1;
    if (currentTextbox === 5) {
      currentTextbox = 0;
    }
    selectTextbox(currentTextbox);
  });
  eventInjectLayout.key(['escape'], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventInjectionModal,
};
