import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { ModalTitle } from "../components/modalTitle";
import { InteractiveList } from "../components/interactiveList";

function updateStackTable(table, stacks) {
  table.setItems(stacks);
}

function updateStackNames(api, table, screen) {
  api.describeStacks({}, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const stacks = [];
      data.Stacks.forEach((stack) => {
        stacks.push(stack.StackName);
      });
      updateStackTable(table, stacks);
      screen.render();
    }
  });
}

const stackWizardModal = (screen, cloudformation, application) => {
  const wizardLayout = new ModalLayout(screen, 112, 27, true);

  const closeModal = () => {
    application.returnFocus();
    wizardLayout.destroy();
  };

  new ModalTitle(wizardLayout, 110, "Select your stack");

  const stackTable = new InteractiveList(wizardLayout, 110, 20, "Stacks");

  new Box(
    wizardLayout,
    110,
    4,
    "Arrow keys to navigate | ENTER to select stack"
  );

  updateStackNames(cloudformation, stackTable, screen);
  stackTable.focus();

  stackTable.key(["enter"], () => {
    closeModal();
  });

  screen.render();
  return stackTable;
};

module.exports = { stackWizardModal };
