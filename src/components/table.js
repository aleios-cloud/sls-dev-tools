const contrib = require("blessed-contrib");

class Table {
  constructor(application) {
    this.application = application;
    this.table = this.generateTable();
  }

  generateTable() {
    return this.application.layoutGrid.set(0, 6, 4, 6, contrib.table, {
      keys: true,
      fg: "green",
      label: "<-         Lambda Functions         ->",
      columnSpacing: 1,
      columnWidth: [35, 40, 10, 10, 20],
      style: {
        border: {
          fg: "yellow",
        },
      },
    });
  }
}

module.exports = {
  Table,
};
