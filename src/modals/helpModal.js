import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";

const blessed = require("blessed");

const helpModal = (screen, application) => {
  const helpMenuData = [
    ["Keybinding", "Action"],
    ["-----------", "-----------"],
    ["Enter", "Displays function data when focused on Functions table"],
    ["o", "Opens the AWS console for a selected lambda function or event bus"],
    ["q", "Close the application"],
    ["d", "Deploys the selected lambda function"],
    ["s", "Deploys all the lambda functions within the stack"],
    ["Up/Down Arrows", "Select entry in list, by default the function list"],
    ["Right/Left Arrows", "Switch between resource tables"],
    ["Tab", "Used to change focus between selected windows"],
    ["i", "Invoke a lambda or inject an event into an event bus"],
    ["r", "Open the EventBridge Registry window for the selected event bus"],
    ["l", "Open the Lambda Statistics window for the selected lambda"],
  ];
  const cliOptionsData = [
    ["---------", "----------"],
    ["CLI Option", "Description"],
    ["---------", "----------"],
    ["-V, --version", "output the version number"],
    ["-n, --stack-name <stackName>", "AWS stack name"],
    ["-r, --region <region>", "AWS region"],
    ["-t, --start-time <startTime>", "when to start from"],
    ["-i, --interval <interval>", "interval of graphs, in seconds"],
    ["-p, --profile <profile>", "aws profile name to use"],
    ["-h, --help", "output usage information"],
    ["-l, --location <location>", "location of your serverless project"],
    ["-s, --stage <stage>", "If --sls is set, use this stage"],
    ["--sls", "use the serverless framework to execute commands"],
    ["--sam", "use the SAM framework to execute commands"],
  ];
  const helpLayout = new ModalLayout(screen, 112, 35, true);

  blessed.listtable({
    parent: helpLayout,
    interactive: false,
    top: "center",
    left: "center",
    data: [...helpMenuData, ...cliOptionsData],
    border: "line",
    pad: 2,
    width: 110,
    height: 29,
    style: {
      border: { fg: "green" },
      header: { fg: "bright-green", bold: true, underline: true },
      cell: { fg: "yellow" },
    },
  });

  new Box(
    helpLayout,
    110,
    4,
    "Please give feedback via GitHub Issues \n ESC to close"
  );

  helpLayout.focus();
  helpLayout.key(["escape"], () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    helpLayout.destroy();
  });
};

module.exports = {
  helpModal,
};
