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

  new ModalTitle(expandedLogLayout, "100%", title);

  const logBox = new ScrollableBox(expandedLogLayout, "100%", "89%", content);

  new Box(expandedLogLayout, "99%", 4, "ESC to close");

  logBox.focus();

  logBox.key(["escape"], () => {
    // Discard modal
    closeModal();
  });

  // Enables text selection, but disables scrolling
  // screen.program.disableMouse();
};

module.exports = {
  expandedLogModal,
};
