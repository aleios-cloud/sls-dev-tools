const blessed = require("blessed");

class ScrollableBox extends blessed.box {
  constructor(parent, width, height, content) {
    super({
      parent,
      width,
      height,
      left: "right",
      top: "center",
      padding: { left: 2, right: 2 },
      border: "bg",
      style: { fg: "green" },
      content,
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
    });
  }
}

module.exports = {
  ScrollableBox,
};
