import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";
import { Loader } from "../components/loader";

const disableRelayWarningModal = (screen, application) => {
  const disableRelayWarningLayout = new ModalLayout(screen, 112, 20, true);

  const numBoxes = 2;
  let currentBox = 0;
  const boxes = [];

  const unselectButton = (index) => {
    boxes[index].style.border.fg = "green";
    boxes[index].style.fg = "green";
  };

  const selectButton = (index) => {
    boxes[index].style.border.fg = "yellow";
    boxes[index].style.fg = "yellow";
  };

  const closeModal = () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    disableRelayWarningLayout.destroy();
  };

  new ModalTitle(disableRelayWarningLayout, 110, "Disable Relay");

  new Box(
    disableRelayWarningLayout,
    110,
    4,
    "You still have active Relay layers on some of your Lambdas. We strongly recommend disabling these before quitting the tool"
  );

  const confirmButton = new Box(
    disableRelayWarningLayout,
    110,
    4,
    "Disable all Relay layers and quit"
  );
  const dismissButton = new Box(disableRelayWarningLayout, 110, 4, "Dismiss");

  boxes.push(confirmButton);
  boxes.push(dismissButton);

  new Box(
    disableRelayWarningLayout,
    110,
    4,
    "Use the arrow keys and ENTER to select option\nESC to close"
  );

  disableRelayWarningLayout.focus();

  selectButton(currentBox);

  disableRelayWarningLayout.key(["enter"], () => {
    // If confirm selected, disable Relay layers
    if (currentBox === 0) {
      const loader = new Loader(screen, 5, 30);
      loader.load("Disabling Relay layers...");
      // Simulate remove layers API callback
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    } else {
      // Dismiss warning and allow user to quit
      application.setWarningGiven(true);
      closeModal();
    }
  });

  disableRelayWarningLayout.key(["up"], () => {
    unselectButton(currentBox);
    currentBox -= 1;
    if (currentBox === -1) {
      currentBox = numBoxes - 1;
    }
    selectButton(currentBox);
  });
  disableRelayWarningLayout.key(["down"], () => {
    unselectButton(currentBox);
    currentBox += 1;
    if (currentBox === numBoxes) {
      currentBox = 0;
    }
    selectButton(currentBox);
  });
  disableRelayWarningLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  disableRelayWarningModal,
};
