import { generateFieldWithTitle } from "../components/fieldWithTitle";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

const eventInjectionModal = (
  screen,
  blessed,
  eventBridge,
  application,
  injectEvent,
  prefilledEvent
) => {
  const eventInjectLayout = new ModalLayout(screen, 112, 27, true);

  // Prefill textbox with previous submission if there is one
  const event = prefilledEvent || {
    EventBusName: eventBridge,
    DetailType: "",
    Source: "",
    Detail: "{}",
  };

  // String values textboxes are initialized with
  const preset = [
    event.EventBusName,
    event.DetailType,
    event.Source,
    event.Detail,
  ];

  const fields = ["EventBusName", "DetailType", "Source", "Detail"];

  const numTextboxes = 4;

  let currentTextbox = 1;

  const textboxes = [];

  const unselectTextbox = (index) => {
    textboxes[index].style.border.fg = "green";
    if (index === 4) {
      textboxes[index].style.fg = "green";
    }
  };

  const selectTextbox = (index) => {
    textboxes[index].style.border.fg = "yellow";
    if (index === 4) {
      textboxes[index].style.fg = "yellow";
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

  new ModalTitle(eventInjectLayout, 110, "Event Injection");

  for (let i = 0; i < numTextboxes; i += 1) {
    const textboxWithTitle = generateFieldWithTitle(
      blessed,
      eventInjectLayout,
      fields[i],
      preset[i],
      110
    );
    const { textbox } = textboxWithTitle;
    textbox.on("cancel", () => {
      updateEventValues();
      closeModal();
    });
    textboxes.push(textbox);
  }

  const submit = new Box(eventInjectLayout, 110, 4, "Submit");

  textboxes.push(submit);

  new Box(
    eventInjectLayout,
    110,
    4,
    "Arrow keys to select field | ENTER to toggle edit mode \nENTER on Submit to inject event | ESC to close"
  );

  eventInjectLayout.focus();

  selectTextbox(currentTextbox);

  eventInjectLayout.key(["enter"], () => {
    // Inject event or select field for entry
    if (currentTextbox === 4) {
      updateEventValues();
      injectEvent(event);
      closeModal();
    } else {
      textboxes[currentTextbox].focus();
    }
  });
  eventInjectLayout.key(["up"], () => {
    unselectTextbox(currentTextbox);
    currentTextbox -= 1;
    if (currentTextbox === -1) {
      currentTextbox = 4;
    }
    selectTextbox(currentTextbox);
  });
  eventInjectLayout.key(["down"], () => {
    unselectTextbox(currentTextbox);
    currentTextbox += 1;
    if (currentTextbox === 5) {
      currentTextbox = 0;
    }
    selectTextbox(currentTextbox);
  });
  eventInjectLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  eventInjectionModal,
};
