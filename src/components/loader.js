const blessed = require("blessed");

class Loader {
  constructor(parent, height, width) {
    return blessed.loading({
      parent,
      height,
      width,
      left: "center",
      top: "center",
      align: "center",
      border: "line",
      style: { fg: "green", border: { fg: "green" } },
    });
  }
}

module.exports = {
  Loader,
};
