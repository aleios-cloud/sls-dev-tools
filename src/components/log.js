const blessed = require("blessed");

class Log {
  constructor(layoutGrid, label, row, col, rowSpan, colSpan) {
    this.grid = layoutGrid;
    this.label = label;
    this.row = row;
    this.col = col;
    this.rowSpan = rowSpan;
    this.colSpan = colSpan;
    this.generateLog();
  }

  generateLog() {
    const log = this.grid.set(
      this.row,
      this.col,
      this.rowSpan,
      this.colSpan,
      blessed.log,
      {
        fg: "green",
        selectedFg: "green",
        label: this.label,
        interactive: true,
        scrollbar: { bg: "blue" },
        mouse: true,
      }
    );
    this.datalog = log;
  }

  log(data) {
    this.datalog.log(data);
  }

  setContent(data) {
    this.datalog.setContent(data);
  }
}

module.exports = {
  Log,
};
