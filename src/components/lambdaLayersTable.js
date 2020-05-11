const contrib = require("blessed-contrib");

class LambdaLayersTable {
  constructor(parent, width, height) {
    this.parent = parent;
    this.width = width;
    this.height = height;
    this.table = this.generateTable();
  }

  generateTable() {
    const table = contrib.table({
      fg: "white",
      interactive: false,
      label: "Lambda Layers",
      columnWidth: [20, 30],
      border: "line",
      style: { fg: "green", border: { fg: "green" } },
      width: this.width,
      height: this.height,
    });
    this.parent.append(table);
    return table;
  }

  static extractLayerInfo(lambdaFuncInfo) {
    if (lambdaFuncInfo.Layers) {
      return lambdaFuncInfo.Layers.map((layer) => {
        const s = layer.Arn.split(":");
        const layerName = s[s.length - 2];
        const layerVersion = s[s.length - 1];
        return [layerName, layerVersion];
      });
    }
    return [["-", "-"]];
  }

  updateData(lambdaFuncInfo) {
    this.table.setData({
      headers: ["Name", "Version"],
      data: LambdaLayersTable.extractLayerInfo(lambdaFuncInfo),
    });
  }
}

module.exports = {
  LambdaLayersTable,
};
