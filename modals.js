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

  const numTextboxes = 4;

  const textboxes = [];

  const focusTextbox = (index) => {
    if (index >= 0 && index < textboxes.length) {
      textboxes[index].focus();
    } else {
      console.error('Index out of bounds');
    }
  };

  const updateEventValues = () => {
    event.EventBusName = textboxes[0].getValue();
    event.DetailType = textboxes[1].getValue();
    event.Source = textboxes[2].getValue();
    event.Detail = textboxes[3].getValue();
  };

  for (let i = 0; i < numTextboxes; i += 1) {
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
      keys: true,
      inputOnFocus: true,
      secret: false,
      censor: false,
      value: preset[i],
    });
    // All textboxes except the last
    if (i < numTextboxes - 1) {
      // Change focus to next textbox
      textbox.on('submit', () => focusTextbox((i + 1) % numTextboxes));
    }
    // All textboxes except the first
    if (i > 0) {
      // Change focus to prev textbox
      textbox.on('cancel', () => focusTextbox((i - 1) % numTextboxes));
    }
    textbox.on('action', () => updateEventValues());
    textboxes.push(textbox);
  }

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
    content: 'i to enter editor \n ENTER to inject event | ESC to discard and close',
  });

  const closeModal = () => {
    // Store all text to populate modal when next opened
    application.previousSubmittedEvent[eventBridge] = event;
    application.setIsModalOpen(false);
    application.returnFocus();
    eventInjectLayout.destroy();
  };

  eventInjectLayout.focus();

  eventInjectLayout.key(['i'], () => {
    // Edit fields
    textboxes[0].focus();
  });

  eventInjectLayout.key(['enter'], () => {
    // Inject event
    injectEvent(event);
    closeModal();
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
