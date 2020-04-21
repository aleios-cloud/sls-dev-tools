const blessed = require("blessed");

class ModalLayout extends blessed.layout {
  constructor(parent, width, height, keys) {
    super({
      parent,
      top: "center",
      left: "center",
      width,
      height,
      border: "line",
      style: { border: { fg: "green" } },
      keys,
      grabKeys: keys,
    })
  }
}

module.exports = {
  ModalLayout,
};
