import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";
import { Loader } from "../components/loader";

async function createRelay(apiGateway, fullLambda, program) {
  await apiGateway.createWebsocket(fullLambda, program);
}

const relayModal = (screen, application, apiGateway, fullLambda, program) => {
  const relayLayout = new ModalLayout(screen, 112, 20, true);

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
    relayLayout.destroy();
  };

  new ModalTitle(relayLayout, 110, "Setup Relay?");

  new Box(
    relayLayout,
    110,
    4,
    "Select yes to add the Relay layer to your lambda function.\nThis allows you to receive lambda logs faster than the AWS console displays them"
  );

  const yesButton = new Box(relayLayout, 110, 4, "Yes");
  const noButton = new Box(relayLayout, 110, 4, "No");

  boxes.push(yesButton);
  boxes.push(noButton);

  new Box(
    relayLayout,
    110,
    4,
    "Use the arrow keys and ENTER to select option\nESC to close"
  );

  relayLayout.focus();

  selectButton(currentBox);

  relayLayout.key(["enter"], () => {
    // If yes selected, begin Relay setup
    if (currentBox === 0) {
      // setup Relay
      console.log("Setting up Relay...");
      const loader = new Loader(screen, 5, 20);
      loader.load("Please wait");
      createRelay(apiGateway, fullLambda, program);
      loader.stop();
      loader.destroy();
    }
    closeModal();
  });

  relayLayout.key(["up"], () => {
    unselectButton(currentBox);
    currentBox -= 1;
    if (currentBox === -1) {
      currentBox = numBoxes - 1;
    }
    selectButton(currentBox);
  });
  relayLayout.key(["down"], () => {
    unselectButton(currentBox);
    currentBox += 1;
    if (currentBox === numBoxes) {
      currentBox = 0;
    }
    selectButton(currentBox);
  });
  relayLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  relayModal,
};
