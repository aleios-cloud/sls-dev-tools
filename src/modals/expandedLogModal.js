import { Box } from "../components/box";
import { ScrollableBox } from "../components/scrollableBox";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

const expandedLogModal = (screen, application, title, content) => {
  const expandedLogLayout = new ModalLayout(screen, "100%", "100%", true);
  expandedLogLayout.border = "bg";

  const closeModal = () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    expandedLogLayout.destroy();
    screen.program.enableMouse();
  };

  // Whether user can scroll the logs or click and drag to select text
  let canScroll = false;

  const modalTitle = new ModalTitle(expandedLogLayout, "100%", "");

  modalTitle.style = { fg: "yellow" };
  modalTitle.content = `${title}`;

  const logBox = new ScrollableBox(expandedLogLayout, "100%", "89%", content);

  new Box(
    expandedLogLayout,
    "99%",
    4,
    "ESC to close || t to toggle between text selection and scrolling"
  );

  logBox.focus();

  logBox.key(["escape"], () => {
    // Discard modal
    closeModal();
  });

  logBox.key(["t"], () => {
    if (canScroll) {
      // Enables text selection, but disables scrolling
      screen.program.disableMouse();
      canScroll = false;
      modalTitle.content = `${title} - SELECTABLE`;
    } else {
      // Enables scrolling, but disables text selection
      screen.program.enableMouse();
      canScroll = true;
      modalTitle.content = `${title} - SCROLLABLE`;
    }
  });
};

module.exports = {
  expandedLogModal,
};
