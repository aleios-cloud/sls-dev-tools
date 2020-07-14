import { generateFieldWithTitle } from "../components/fieldWithTitle";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";
import { invokeLambda } from "../services/invoke";

const blessed = require("blessed");

const wrapPayload = (payload) => JSON.stringify({ body: payload });

const lambdaInvokeModal = (
  screen,
  application,
  functionName,
  awsLambdaApi,
  previousLambdaPayload
) => {
  const lambdaInvokeLayout = new ModalLayout(screen, 112, 20, true);

  const preset = [functionName, previousLambdaPayload || "{}"];

  const fields = ["FunctionName", "Payload"];

  const numTextboxes = 2;
  let currentTextbox = 1;
  const textboxes = [];

  const unselectTextbox = (index) => {
    textboxes[index].style.border.fg = "green";
    if (index === 2) {
      textboxes[index].style.fg = "green";
    }
  };

  const selectTextbox = (index) => {
    textboxes[index].style.border.fg = "yellow";
    if (index === 2) {
      textboxes[index].style.fg = "yellow";
    }
  };

  const storePayload = () => {
    application.previousLambdaPayload[functionName] = textboxes[1].getValue();
  };

  const closeModal = () => {
    // Store the payload
    storePayload();
    application.setIsModalOpen(false);
    application.returnFocus();
    lambdaInvokeLayout.destroy();
  };

  new ModalTitle(lambdaInvokeLayout, 110, "Lambda Invoke");

  for (let i = 0; i < numTextboxes; i += 1) {
    const textboxWithTitle = generateFieldWithTitle(
      blessed,
      lambdaInvokeLayout,
      fields[i],
      preset[i],
      110
    );
    const { textbox } = textboxWithTitle;
    textbox.on("cancel", () => {
      closeModal();
    });
    textboxes.push(textbox);
  }

  const submit = new Box(lambdaInvokeLayout, 110, 4, "Submit");

  textboxes.push(submit);

  new Box(
    lambdaInvokeLayout,
    110,
    6,
    // eslint-disable-next-line quotes
    'Arrow keys to select field | ENTER to toggle edit mode \n Note: payload wrapped {"body": {...}} \nENTER on Submit to inject event | ESC to close'
  );

  lambdaInvokeLayout.focus();

  selectTextbox(currentTextbox);

  lambdaInvokeLayout.key(["enter"], () => {
    // Inject event or select field for entry
    if (currentTextbox === 2) {
      invokeLambda(
        awsLambdaApi,
        functionName,
        wrapPayload(textboxes[1].getValue())
      );
      closeModal();
    } else {
      textboxes[currentTextbox].focus();
    }
  });
  lambdaInvokeLayout.key(["up"], () => {
    unselectTextbox(currentTextbox);
    currentTextbox -= 1;
    if (currentTextbox === -1) {
      currentTextbox = 2;
    }
    selectTextbox(currentTextbox);
  });
  lambdaInvokeLayout.key(["down"], () => {
    unselectTextbox(currentTextbox);
    currentTextbox += 1;
    if (currentTextbox === 3) {
      currentTextbox = 1;
    }
    selectTextbox(currentTextbox);
  });
  lambdaInvokeLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  lambdaInvokeModal,
};
