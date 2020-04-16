function modalLayout(blessed, parent, width, height, keys) {
  return blessed.layout({
    parent,
    top: "center",
    left: "center",
    width,
    height,
    border: "line",
    style: { border: { fg: "green" } },
    keys,
    grabKeys: keys,
  });
}

module.exports = {
  modalLayout,
};
