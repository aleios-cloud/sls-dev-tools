import { eventInjectionModal } from './eventInjectionModal';
import { generateFieldWithTitle } from '../components/fieldWithTitle';

function updateEvent(api, registry, schema) {
  return api.describeSchema({ RegistryName: registry, SchemaName: schema }).promise();
}

async function getProperties(api, registry, schema, event) {
  const data = await updateEvent(api, registry, schema);
  let parsedEvent = JSON.parse(data.Content);
  // Update detailType and source fields from schema
  const detailType = parsedEvent.components.schemas.AWSEvent['x-amazon-events-detail-type'];
  const source = parsedEvent.components.schemas.AWSEvent['x-amazon-events-source'];
  event.DetailType = detailType;
  event.Source = source;
  // "detail" is contained in the AWSEvent schema as a reference,
  // typically of the form #/components/schemas/TestEvent
  const eventDetail = parsedEvent.components.schemas.AWSEvent.properties.detail.$ref;
  //  Convert reference to an array of properties, to create a path to "detail"
  const pathToDetail = eventDetail.replace('#/', '').split('/');
  // Updated parsedEvent to the "detail" field stored at the end of the path
  pathToDetail.forEach((parsed) => parsedEvent = parsedEvent[parsed]);
  if (Object.prototype.hasOwnProperty.call(parsedEvent, 'required')) {
    return parsedEvent.required;
  }
  return [];
}

const createDynamicForm = async (blessed, api, registry, schema, parent, textboxes, fieldNames, closeModal, event) => {
  let fieldList = [];
  try {
    fieldList = await getProperties(api, registry, schema, event);
  } catch (e) {
    console.error(e);
  }

  if (fieldList.length > 5) {
    blessed.box({
      parent,
      width: 106,
      height: 4,
      left: 'right',
      top: 'center',
      align: 'center',
      padding: { left: 2, right: 2 },
      border: 'line',
      style: { fg: 'green', border: { fg: 'green' } },
      content: "The tool currently can't display more than 5 fields.\nComing in the next version!",
    });
  } else if (fieldList !== []) {
    fieldList.forEach((field) => {
      const textbox = generateFieldWithTitle(blessed, parent, field, '', 106);
      textbox.on('cancel', () => {
        closeModal();
      });
      textboxes.push(textbox);
      fieldNames.push(field);
    });
  }
};

const createDetail = (keys, textboxes) => {
  try {
    const values = [];
    textboxes.forEach((textbox) => values.push(textbox.getValue()));
    const detail = {};
    for (let i = 0; i < keys.length; i += 1) {
      detail[keys[i]] = values[i];
    }
    return detail;
  } catch (e) {
    console.log(e);
  }
};

const eventModal = (screen, blessed, eventBridge, application, api, registry, schema, injectEvent) => {
  const eventLayout = blessed.layout({
    parent: screen,
    top: 'center',
    left: 'center',
    width: 112,
    height: 33,
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

  const fieldNames = [];

  const event = {
    EventBusName: eventBridge,
    DetailType: '',
    Source: '',
    Detail: '{}',
  };

  const unselectTextbox = (index) => {
    textboxes[index].style.border.fg = 'green';
    // If textbox is the submit button
    if (index === 0) {
      textboxes[index].style.fg = 'green';
    }
  };

  const selectTextbox = (index) => {
    textboxes[index].style.border.fg = 'yellow';
    // If textbox is the submit button
    if (index === 0) {
      textboxes[index].style.fg = 'yellow';
    }
  };

  blessed.box({
    parent: eventLayout,
    width: 110,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    style: { fg: 'green' },
    content: `Event Injection - ${schema}`,
  });

  const fieldLayout = blessed.layout({
    parent: eventLayout,
    top: 'center',
    left: 'center',
    width: 110,
    height: 22,
    border: 'line',
    style: { border: { fg: 'green' } },
    keys: true,
    grabKeys: true,
  });

  const submit = blessed.box({
    parent: eventLayout,
    width: 110,
    height: 4,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'yellow', border: { fg: 'yellow' } },
    content: 'Submit',
  });

  // Push submit to front of textboxes array to avoid race conditions
  textboxes.push(submit);

  createDynamicForm(blessed, api, registry, schema, fieldLayout, textboxes, fieldNames, closeModal, event);

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
    content: 'Arrow keys to select field | ENTER to toggle edit mode \nENTER on Submit to inject event | ESC to close',
  });

  fieldLayout.focus();

  fieldLayout.key(['enter'], () => {
    // If submit button is in focus
    try {
      if (currentTextbox === 0) {
        // Slice textboxes to ignore submit button
        const detail = JSON.stringify(createDetail(fieldNames, textboxes.slice(1)));
        event.Detail = detail;
        eventLayout.destroy();
        eventInjectionModal(screen, blessed, eventBridge, application, injectEvent, event);
      } else {
        // Edit field
        textboxes[currentTextbox].focus();
      }
    } catch (e) {
      console.log(e);
    }
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
