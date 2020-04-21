const blessed = require("blessed");

class InteractiveList extends blessed.list {
  constructor(parent, width, height, label) {
    super({
      parent,
      width,
      height,
      border: "line",
      style: { fg: "green", border: { fg: "green" } },
      padding: { left: 2, right: 2 },
      left: "right",
      top: "center",
      keys: true,
      interactive: true,
      items: ["loading"],
      invertSelected: true,
      label,
    });
  }
}

module.exports = {
  InteractiveList,
};
