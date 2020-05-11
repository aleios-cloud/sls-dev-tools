const contrib = require("blessed-contrib");

class LambdaDeploymentsTable {
  constructor(parent, lambda, width, height) {
    this.parent = parent;
    this.lambda = lambda;
    this.width = width;
    this.height = height;
    this.table = this.generateTable();
  }

  generateTable() {
    const table = contrib.table({
      fg: "white",
      interactive: false,
      label: "Deployment History",
      columnWidth: [10, 40],
      border: "line",
      style: { fg: "green", border: { fg: "green" } },
      width: this.width,
      height: this.height,
    });
    this.parent.append(table);
    return table;
  }

  updateData(lambdaName) {
    const listVersionsByFunctionParams = {
      FunctionName: lambdaName,
    };
    this.lambda.listVersionsByFunction(
      listVersionsByFunctionParams,
      (err, data) => {
        if (err) {
          console.log(err, err.stack);
        } else {
          const versions = data.Versions;
          this.table.setData({
            headers: ["Version", "Date"],
            data: versions.map((version) => [
              version.Version,
              version.LastModified,
            ]),
          });
        }
      }
    );
  }
}

module.exports = {
  LambdaDeploymentsTable,
};
