function modalTitle(blessed, parent, width, content) {
  return blessed.box({
    parent,
    width,
    left: "right",
    top: "center",
    align: "center",
    padding: { left: 2, right: 2 },
    style: { fg: "green" },
    content,
  });
}

module.exports = {
  modalTitle,
};
