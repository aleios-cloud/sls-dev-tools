import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";

const errorModal = (screen, application) => {
  const errorLayout = new ModalLayout(screen, 112, 20, true);

  const closeModal = () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    errorLayout.destroy();
  };

  new ModalTitle(errorLayout, 110, "Setup Relay?");

  new Box(
    errorLayout,
    110,
    13,
    "\n\nThe Relay feature is only available for functions using a Node.js runtime environment"
  );

  new Box(errorLayout, 110, 4, "ESC to close");

  errorLayout.focus();

  errorLayout.key(["escape"], () => {
    // Discard modal
    closeModal();
  });
};

module.exports = {
  errorModal,
};
