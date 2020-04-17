function modalHelpText(blessed, parent, width, height, content) {
  return blessed.box({
    parent,
    width,
    height,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "green", border: { fg: "green" } },
    content,
  });
}

module.exports = {
  modalHelpText,
};
