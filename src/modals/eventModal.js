import { eventInjectionModal } from "./eventInjectionModal";
import { generateFieldWithTitle } from "../components/fieldWithTitle";

function updateEvent(api, registry, schema) {
  return api
    .describeSchema({ RegistryName: registry, SchemaName: schema })
    .promise();
}

function handleAWSEvent(schemas, event) {
  // Update detailType and source fields from schema
  const detailType = schemas.AWSEvent["x-amazon-events-detail-type"];
  const source = schemas.AWSEvent["x-amazon-events-source"];
  event.DetailType = detailType;
  event.Source = source;

  // "detail" is contained in the AWSEvent schema as a reference,
  // typically of the form #/components/schemas/[EventName]
  const reference = schemas.AWSEvent.properties.detail.$ref;
  const schemaName = reference.substring(reference.lastIndexOf("/") + 1);
  const eventSchema = schemas[schemaName];

  if (Object.prototype.hasOwnProperty.call(eventSchema, "properties")) {
    return eventSchema.properties;
  }
  return {};
}

function handleCustomEvent(schemas) {
  if (Object.prototype.hasOwnProperty.call(schemas.Event, "properties")) {
    return schemas.Event.properties;
  }
  return {};
}

async function getProperties(api, registry, schema, event) {
  const data = await updateEvent(api, registry, schema);
  const parsedEvent = JSON.parse(data.Content);
  const parsedSchemas = parsedEvent.components.schemas;

  if (Object.prototype.hasOwnProperty.call(parsedSchemas, "AWSEvent")) {
    return handleAWSEvent(parsedSchemas, event);
  }
  return handleCustomEvent(parsedSchemas);
}

const createDynamicForm = async (
  blessed,
  api,
  parent,
  closeModal,
  modalState,
  updatePageText
) => {
  const fields = await getProperties(
    api,
    modalState.registry,
    modalState.schema,
    modalState.event
  );

  const fieldNames = Object.keys(fields);

  if (fieldNames !== []) {
    fieldNames.forEach((field) => {
      const textboxWithTitle = generateFieldWithTitle(
        blessed,
        parent,
        field,
        "",
        106
      );
      const { textbox } = textboxWithTitle;
      const { titleBox } = textboxWithTitle;
      textbox.on("cancel", () => {
        closeModal();
      });
      modalState.textboxes.push(textbox);
      modalState.titles.push(titleBox);
      modalState.fieldNames.push(field);
      modalState.fieldTypes.push(fields[field].type);
    });
    if (fieldNames.length > 0) {
      // Change focus to first field instead of submit button
      modalState.currentTextbox = 0;
      modalState.buttons[0].style.border.fg = "green";
      modalState.buttons[0].style.fg = "green";
      modalState.buttonSelected = false;
      modalState.textboxes[0].style.border.fg = "yellow";
      // Calculate total number of pages
      modalState.numPages = Math.ceil(fieldNames.length / 5);
    }
    // Hide fields after the 5th
    if (fieldNames.length > 5) {
      for (let i = 5; i < modalState.textboxes.length; i += 1) {
        modalState.textboxes[i].hide();
        modalState.titles[i].hide();
      }
    }
    // Update page text
    updatePageText();
  }
};

const createDetail = (keys, types, textboxes) => {
  const values = [];
  textboxes.forEach((textbox) => values.push(textbox.getValue()));
  const detail = {};
  for (let i = 0; i < keys.length; i += 1) {
    if (types[i] === "number") {
      detail[keys[i]] = Number(values[i]);
    } else {
      detail[keys[i]] = values[i];
    }
  }
  return detail;
};

const eventModal = (
  screen,
  blessed,
  eventBridge,
  application,
  api,
  registry,
  schema,
  injectEvent
) => {
  const eventLayout = blessed.layout({
    parent: screen,
    top: "center",
    left: "center",
    width: 112,
    height: 35,
    border: "line",
    style: { border: { fg: "green" } },
    keys: true,
    grabKeys: true,
  });

  const closeModal = () => {
    // Store all text to populate modal when next opened
    application.setIsModalOpen(false);
    application.returnFocus();
    eventLayout.destroy();
  };

  const modalState = {
    currentTextbox: 0,
    currentPage: 1,
    numPages: 1,
    textboxes: [],
    titles: [],
    buttons: [],
    buttonSelected: true,
    fieldNames: [],
    fieldTypes: [],
    registry,
    schema,
    event: {
      EventBusName: eventBridge,
      DetailType: "",
      Source: "",
      Detail: "{}",
    },
  };

  const unselectTextbox = (index) => {
    modalState.textboxes[index].style.border.fg = "green";
  };

  const selectTextbox = (index) => {
    modalState.textboxes[index].style.border.fg = "yellow";
  };

  const selectButton = () => {
    modalState.buttonSelected = true;
    modalState.buttons[0].style.border.fg = "yellow";
    modalState.buttons[0].style.fg = "yellow";
  };

  const unSelectButton = () => {
    modalState.buttonSelected = false;
    modalState.buttons[0].style.border.fg = "green";
    modalState.buttons[0].style.fg = "green";
  };

  const hidePage = (pageNum) => {
    const lowerBound = (pageNum - 1) * 5;
    const upperBound = Math.min(lowerBound + 5, modalState.textboxes.length);
    for (let i = lowerBound; i < upperBound; i += 1) {
      modalState.textboxes[i].hide();
      modalState.titles[i].hide();
    }
  };

  const showPage = (pageNum) => {
    const lowerBound = (pageNum - 1) * 5;
    const upperBound = Math.min(lowerBound + 5, modalState.textboxes.length);
    for (let i = lowerBound; i < upperBound; i += 1) {
      modalState.textboxes[i].show();
      modalState.titles[i].show();
    }
  };

  const nextPage = () => {
    unselectTextbox(modalState.currentTextbox);
    hidePage(modalState.currentPage);
    modalState.currentPage += 1;
    showPage(modalState.currentPage);
    modalState.currentTextbox = (modalState.currentPage - 1) * 5 + 1;
    selectTextbox(modalState.currentTextbox);
  };

  const prevPage = () => {
    unselectTextbox(modalState.currentTextbox);
    hidePage(modalState.currentPage);
    modalState.currentPage -= 1;
    showPage(modalState.currentPage);
    modalState.currentTextbox = (modalState.currentPage - 1) * 5 + 1;
    selectTextbox(modalState.currentTextbox);
  };

  blessed.box({
    parent: eventLayout,
    width: 110,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    style: { fg: "green" },
    content: `Event Injection - ${schema}`,
  });

  const currentPageText = blessed.box({
    parent: eventLayout,
    width: 110,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    style: { fg: "green" },
  });

  const updateCurrentPageText = () => {
    currentPageText.content = `Page ${modalState.currentPage} of ${modalState.numPages}`;
  };

  const fieldLayout = blessed.layout({
    parent: eventLayout,
    top: "center",
    left: "center",
    width: 110,
    height: 22,
    border: "line",
    style: { border: { fg: "green" } },
    keys: true,
    grabKeys: true,
  });

  const submit = blessed.box({
    parent: eventLayout,
    width: 110,
    height: 4,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "yellow", border: { fg: "yellow" } },
    content: "Submit",
  });

  // Push submit to front of textboxes array to avoid race conditions
  modalState.buttons.push(submit);

  createDynamicForm(
    blessed,
    api,
    fieldLayout,
    closeModal,
    modalState,
    updateCurrentPageText
  );

  blessed.box({
    parent: eventLayout,
    width: 110,
    height: 5,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "green", border: { fg: "green" } },
    content:
      "Up/Down Arrow keys to select field\n Left/Right arrows keys to change page\nENTER to toggle edit mode | ENTER on Submit to inject event | ESC to close",
  });

  fieldLayout.focus();

  fieldLayout.key(["right"], () => {
    if (modalState.currentPage < modalState.numPages) {
      nextPage();
      updateCurrentPageText();
    }
  });

  fieldLayout.key(["left"], () => {
    if (modalState.currentPage > 1) {
      prevPage();
      updateCurrentPageText();
    }
  });

  fieldLayout.key(["enter"], () => {
    // If submit button is in focus
    if (modalState.buttonSelected === true) {
      const detail = JSON.stringify(
        createDetail(
          modalState.fieldNames,
          modalState.fieldTypes,
          modalState.textboxes
        )
      );
      modalState.event.Detail = detail;
      eventLayout.destroy();
      eventInjectionModal(
        screen,
        blessed,
        eventBridge,
        application,
        injectEvent,
        modalState.event
      );
    } else {
      // Edit field
      modalState.textboxes[modalState.currentTextbox].focus();
    }
  });
  fieldLayout.key(["up"], () => {
    // Indices of fields at the top and bottom of page
    const top = (modalState.currentPage - 1) * 5;
    const bottom = Math.min(modalState.textboxes.length - 1, top + 4);
    // If submit selected, go to bottom
    if (modalState.buttonSelected) {
      if (modalState.textboxes.length > 0) {
        unSelectButton();
        modalState.currentTextbox = bottom;
        selectTextbox(modalState.currentTextbox);
      }
    } else {
      unselectTextbox(modalState.currentTextbox);
      modalState.currentTextbox -= 1;
      if (modalState.currentTextbox < top) {
        selectButton();
      } else {
        selectTextbox(modalState.currentTextbox);
      }
    }
  });
  fieldLayout.key(["down"], () => {
    // Indices of fields at the top and bottom of page
    const top = (modalState.currentPage - 1) * 5;
    const bottom = Math.min(modalState.textboxes.length - 1, top + 4);
    // If submit selected, go to top
    if (modalState.buttonSelected) {
      if (modalState.textboxes.length > 0) {
        unSelectButton();
        modalState.currentTextbox = top;
        selectTextbox(modalState.currentTextbox);
      }
    } else {
      unselectTextbox(modalState.currentTextbox);
      modalState.currentTextbox += 1;
      if (modalState.currentTextbox > bottom) {
        selectButton();
      } else {
        selectTextbox(modalState.currentTextbox);
      }
    }
  });

  fieldLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventModal,
};
