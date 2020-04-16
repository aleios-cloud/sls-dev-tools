import { eventInjectionModal } from "./eventInjectionModal";
import {
  modalTitle,
  modalHelpText,
  modalLayout,
  submitButton,
  generateFieldWithTitle,
} from "../components";
import { getProperties } from "../services/awsSchema";

const createDynamicForm = async (
  blessed,
  api,
  parent,
  closeModal,
  modalState,
  updatePageText
) => {
  let properties = {};
  properties = await getProperties(api, modalState.registry, modalState.schema);

  if (Object.prototype.hasOwnProperty.call(properties, "type")) {
    modalState.event.DetailType = properties.type;
  }
  if (Object.prototype.hasOwnProperty.call(properties, "source")) {
    modalState.event.Source = properties.source;
  }

  const fields = properties.properties;
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
    // Change focus to first field instead of submit button
    modalState.currentTextbox = 0;
    modalState.buttons[0].style.border.fg = "green";
    modalState.buttons[0].style.fg = "green";
    modalState.buttonSelected = false;
    modalState.textboxes[0].style.border.fg = "yellow";
    // Calculate total number of pages
    modalState.numPages = Math.ceil(fieldNames.length / 5);
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

const createDetail = (keys, types, values) => {
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
  const eventLayout = modalLayout(blessed, screen, 112, 35, true);

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

  const setButtonSelected = (value) => {
    const color = value === true ? "yellow" : "green";
    modalState.buttonSelected = value;
    modalState.buttons[0].style.border.fg = color;
    modalState.buttons[0].style.fg = color;
  };

  const togglePage = (pageNum) => {
    const lowerBound = (pageNum - 1) * 5;
    const upperBound = Math.min(lowerBound + 5, modalState.textboxes.length);
    for (let i = lowerBound; i < upperBound; i += 1) {
      modalState.textboxes[i].toggle();
      modalState.titles[i].toggle();
    }
  };

  const nextPage = () => {
    unselectTextbox(modalState.currentTextbox);
    togglePage(modalState.currentPage);
    modalState.currentPage += 1;
    togglePage(modalState.currentPage);
    modalState.currentTextbox = (modalState.currentPage - 1) * 5 + 1;
    selectTextbox(modalState.currentTextbox);
  };

  const prevPage = () => {
    unselectTextbox(modalState.currentTextbox);
    togglePage(modalState.currentPage);
    modalState.currentPage -= 1;
    togglePage(modalState.currentPage);
    modalState.currentTextbox = (modalState.currentPage - 1) * 5 + 1;
    selectTextbox(modalState.currentTextbox);
  };

  modalTitle(blessed, eventLayout, 110, `Event Injection - ${schema}`);
  const currentPageText = modalTitle(blessed, eventLayout, 110, "");

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

  const submit = submitButton(blessed, eventLayout, 110);

  // Push submit to front of textboxes array to avoid race conditions
  modalState.buttons.push(submit);
  setButtonSelected(true);

  createDynamicForm(
    blessed,
    api,
    fieldLayout,
    closeModal,
    modalState,
    updateCurrentPageText
  );

  modalHelpText(
    blessed,
    eventLayout,
    110,
    5,
    "Up/Down Arrow keys to select field\n Left/Right arrows keys to change page\nENTER to toggle edit mode | ENTER on Submit to inject event | ESC to close"
  );

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
      const values = [];
      modalState.textboxes.forEach((t) => values.push(t.getValue()));
      const detail = JSON.stringify(
        createDetail(modalState.fieldNames, modalState.fieldTypes, values)
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
  fieldLayout.key(["up", "down"], (_, key) => {
    // Indices of fields at the top and bottom of page
    const top = (modalState.currentPage - 1) * 5;
    const bottom = Math.min(modalState.textboxes.length - 1, top + 4);
    // If submit selected, go to bottom
    if (modalState.buttonSelected) {
      if (modalState.textboxes.length > 0) {
        setButtonSelected(false);
        modalState.currentTextbox = key.name === "down" ? top : bottom;
        selectTextbox(modalState.currentTextbox);
      }
    } else {
      unselectTextbox(modalState.currentTextbox);
      modalState.currentTextbox += key.name === "down" ? 1 : -1;
      if (
        modalState.currentTextbox < top ||
        modalState.currentTextbox > bottom
      ) {
        setButtonSelected(true);
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
