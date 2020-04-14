import { generateFieldWithTitle } from '../components/fieldWithTitle';

function updateEvent(api, registry, schema) {
  return api.describeSchema({ RegistryName: registry, SchemaName: schema }).promise();
}

async function getProperties(api, registry, schema) {
  const data = await updateEvent(api, registry, schema);
  let parsedEvent = JSON.parse(data.Content);
  const eventDetail = parsedEvent.components.schemas.AWSEvent.properties.detail.$ref;
  const pathToDetail = eventDetail.replace('#/', '').split('/');
  pathToDetail.forEach((parsed) => parsedEvent = parsedEvent[parsed]);
  if (Object.prototype.hasOwnProperty.call(parsedEvent, 'required')) {
    return parsedEvent.required;
  }
  return [];
}

const createDynamicForm = async (blessed, api, registry, schema, parent, textboxes, closeModal) => {
  let fieldList = [];
  try {
    fieldList = await getProperties(api, registry, schema);
  } catch (e) {
    console.error(e);
  }

  if (fieldList !== []) {
    fieldList.forEach((field) => {
      const textbox = generateFieldWithTitle(blessed, parent, field, '', 106);
      textbox.on('cancel', () => {
        closeModal();
      });
      textboxes.push(textbox);
    });
    // Highlight first field for entry
    textboxes[0].style.border.fg = 'yellow';
  }
};

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

  let currentTextbox = 0;

  const textboxes = [];

  const unselectTextbox = (index) => {
    textboxes[index].style.border.fg = 'green';
  };

  const selectTextbox = (index) => {
    textboxes[index].style.border.fg = 'yellow';
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

  const fieldLayout = blessed.layout({
    parent: eventLayout,
    top: 'center',
    left: 'center',
    width: 110,
    height: 20,
    border: 'line',
    style: { border: { fg: 'green' } },
    keys: true,
    grabKeys: true,
  });

  createDynamicForm(blessed, api, registry, schema, fieldLayout, textboxes, closeModal);

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

  fieldLayout.focus();

  fieldLayout.key(['enter'], () => {
    // Select field for entry
    textboxes[currentTextbox].focus();
  });
  fieldLayout.key(['up'], () => {
    unselectTextbox(currentTextbox);
    currentTextbox -= 1;
    if (currentTextbox === -1) {
      currentTextbox = textboxes.length - 1;
    }
    selectTextbox(currentTextbox);
  });
  fieldLayout.key(['down'], () => {
    unselectTextbox(currentTextbox);
    currentTextbox += 1;
    if (currentTextbox === textboxes.length) {
      currentTextbox = 0;
    }
    selectTextbox(currentTextbox);
  });

  fieldLayout.key(['escape'], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventModal,
};
