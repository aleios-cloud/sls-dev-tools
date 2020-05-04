import { generateFieldWithTitle } from "../components/fieldWithTitle";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

const blessed = require("blessed");

function promptMfaModal(callback, screen) {
  const mfaLayout = new ModalLayout(screen, 112, 15, true);

  let currentTextbox = 0;
  const textboxes = [];

  const closeModal = () => {
    mfaLayout.destroy();
    callback(null, textboxes[0].getValue());
    screen.render();
  };

  const selectTextbox = (index) => {
    textboxes[index].style.border.fg = "yellow";
    if (index === 1) {
      textboxes[index].style.fg = "yellow";
    }
    screen.render();
  };

  const unselectTextbox = (index) => {
    textboxes[index].style.border.fg = "green";
    if (index === 1) {
      textboxes[index].style.fg = "green";
    }
    screen.render();
  };

  new ModalTitle(mfaLayout, 110, "Enter your MFA Token");

  const textboxWithTitle = generateFieldWithTitle(
    blessed,
    mfaLayout,
    "MFA Token",
    "",
    110
  );
  const { textbox } = textboxWithTitle;
  textbox.on("cancel", () => {
    closeModal();
  });
  textboxes.push(textbox);

  const submit = new Box(mfaLayout, 110, 4, "Submit");

  textboxes.push(submit);

  new Box(
    mfaLayout,
    110,
    4,
    "Arrow keys to select field | ENTER to toggle edit mode \nENTER on Submit to inject event | ESC to close"
  );

  mfaLayout.focus();
  selectTextbox(0);
  screen.render();

  mfaLayout.key(["enter"], () => {
    // this is the submit button
    if (currentTextbox === 1) {
      closeModal();
    } else {
      textboxes[currentTextbox].focus();
    }
  });
  mfaLayout.key(["up"], () => {
    unselectTextbox(currentTextbox);
    currentTextbox -= 1;
    if (currentTextbox === -1) {
      currentTextbox = 0;
    }
    selectTextbox(currentTextbox);
  });
  mfaLayout.key(["down"], () => {
    unselectTextbox(currentTextbox);
    currentTextbox += 1;
    if (currentTextbox === 2) {
      currentTextbox = 1;
    }
    selectTextbox(currentTextbox);
  });
  mfaLayout.key(["escape"], () => {
    closeModal();
  });

  return mfaLayout;
}

module.exports = {
  promptMfaModal,
};
