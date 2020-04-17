function submitButton(blessed, parent, width) {
  return blessed.box({
    parent,
    width,
    height: 4,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    border: "line",
    style: { fg: "yellow", border: { fg: "yellow" } },
    content: "Submit",
  });
}

module.exports = {
  submitButton,
};
