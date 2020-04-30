import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

const listeningStationModal = (screen, application) => {
  const listeningStationLayout = new ModalLayout(screen, 112, 20, true);

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
    listeningStationLayout.destroy();
  };

  new ModalTitle(listeningStationLayout, 110, "Setup Listening Station? (y/n)");

  new Box(
    listeningStationLayout,
    110,
    4,
    "Select yes to add a listening station layer to your lambda function.\nThis allows you to receive lambda logs faster than the AWS console displays them"
  );

  const yesButton = new Box(listeningStationLayout, 110, 4, "Yes");
  const noButton = new Box(listeningStationLayout, 110, 4, "No");

  boxes.push(yesButton);
  boxes.push(noButton);

  new Box(
    listeningStationLayout,
    110,
    4,
    "Use the arrow keys and ENTER to select option or press (y/n)\nESC to close"
  );

  listeningStationLayout.focus();

  selectButton(currentBox);

  listeningStationLayout.key(["enter"], () => {
    // If yes selected, begin listening station setup
    if (currentBox === 0) {
      // setup listening station
      console.log("Setting up listening station...");
    }
    closeModal();
  });
  listeningStationLayout.key(["y", "n"], (_, key) => {
    if (key.name === "y") {
      // setup listening station
      console.log("Setting up listening station...");
    }
    closeModal();
  });

  listeningStationLayout.key(["up"], () => {
    unselectButton(currentBox);
    currentBox -= 1;
    if (currentBox === -1) {
      currentBox = numBoxes - 1;
    }
    selectButton(currentBox);
  });
  listeningStationLayout.key(["down"], () => {
    unselectButton(currentBox);
    currentBox += 1;
    if (currentBox === numBoxes) {
      currentBox = 0;
    }
    selectButton(currentBox);
  });
  listeningStationLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  listeningStationModal,
};
