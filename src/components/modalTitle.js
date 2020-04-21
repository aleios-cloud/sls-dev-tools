const blessed = require('blessed');

class ModalTitle extends blessed.box {
  constructor(parent, width, content) {
    super({
      parent,
      width,
      left: "right",
      top: "center",
      align: "center",
      padding: { left: 2, right: 2 },
      style: { fg: "green" },
      content,
    })
  }
}

module.exports = {
  ModalTitle,
};
