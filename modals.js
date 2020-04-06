const helpModal = (screen, blessed, application) => {
  const helpMenuData = [
    ['Keybinding', 'Action'],
    ['-----------', '-----------'],
    ['Enter', 'Displays function data when focused on Functions table'],
    ['o', 'Opens the AWS console for a selected lambda function'],
    ['q', 'Close the application'],
    ['d', 'Deploys the selected lambda function'],
    ['s', 'Deploys all the lambda functions within the stack'],
    ['Arrows', 'Used to select from list, by default the function list'],
    ['Tab', 'Used to switch focus between lambda functions and event buses'],
    ['i', 'Open an event injection window for the selected event bus'],
  ];
  const cliOptionsData = [
    ['---------', '----------'],
    ['CLI Option', 'Description'],
    ['---------', '----------'],
    ['-V, --version', 'output the version number'],
    ['-n, --stack-name <stackName>', 'AWS stack name'],
    ['-r, --region <region>', 'AWS region'],
    ['-t, --start-time <startTime>', 'when to start from'],
    ['-i, --interval <interval>', 'interval of graphs, in seconds'],
    ['-p, --profile <profile>', 'aws profile name to use'],
    ['-h, --help', 'output usage information'],
  ];
  const helpLayout = blessed.layout({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 112,
    height: 27,
    border: 'line',
    style: { border: { fg: 'green' } },
    keys: true,
  });
  blessed.listtable({
    parent: helpLayout,
    interactive: false,
    top: 'center',
    left: 'center',
    data: [...helpMenuData, ...cliOptionsData],
    border: 'line',
    pad: 2,
    width: 110,
    height: 20,
    style: {
      border: { fg: 'green' },
      header: { fg: 'bright-green', bold: true, underline: true },
      cell: { fg: 'yellow' },
    },
  });
  blessed.box({
    parent: helpLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
    content: 'Please give feedback via GitHub Issues \n ESC to close',
  });
  helpLayout.focus();
  helpLayout.key(['escape'], () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    helpLayout.destroy();
  });
};

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
    textbox.on('cancel', () => closeModal());
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
    content: 'Arrow keys to select field | ENTER to edit/submit\nESC to discard and close',
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
  helpModal,
  eventInjectionModal,
};
