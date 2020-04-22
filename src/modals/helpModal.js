const helpModal = (screen, blessed, application) => {
  const helpMenuData = [
    ["Keybinding", "Action"],
    ["-----------", "-----------"],
    ["Enter", "Displays function data when focused on Functions table"],
    ["o", "Opens the AWS console for a selected lambda function or event bus"],
    ["q", "Close the application"],
    ["d", "Deploys the selected lambda function"],
    ["s", "Deploys all the lambda functions within the stack"],
    ["Arrows", "Used to select from list, by default the function list"],
    ["Tab", "Used to change focus between selected windows"],
    ["i", "Open an event injection window for the selected event bus"],
    ["i", "Invoke lambda function with empty body for the selected function"],
    ["r", "Open the EventBridge Registry window for the selected event bus"],
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
  ];
  const helpLayout = blessed.layout({
    parent: screen,
    top: "center",
    left: "center",
    width: 112,
    height: 27,
    border: "line",
    style: { border: { fg: "green" } },
    keys: true,
  });
  blessed.listtable({
    parent: helpLayout,
    interactive: false,
    top: "center",
    left: "center",
    data: [...helpMenuData, ...cliOptionsData],
    border: "line",
    pad: 2,
    width: 110,
    height: 20,
    style: {
      border: { fg: "green" },
      header: { fg: "bright-green", bold: true, underline: true },
      cell: { fg: "yellow" },
    },
  });
  blessed.box({
    parent: helpLayout,
    width: 110,
    height: 4,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "green", border: { fg: "green" } },
    content: "Please give feedback via GitHub Issues \n ESC to close",
  });
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
