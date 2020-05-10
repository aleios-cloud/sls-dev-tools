const contrib = require("blessed-contrib");

class LambdaLayersTable {
  constructor(parent, lambdaFuncInfo, lambdaName) {
    this.parent = parent;
    this.lambdaFuncInfo = lambdaFuncInfo;
    this.lambdaName = lambdaName;
    this.table = this.generateTable();
  }

  generateTable() {
    const table = contrib.table({
      fg: "white",
      interactive: false,
      label: "Lambda Layers",
      columnWidth: [20, 30],
      padding: { top: 1 },
    });
    this.parent.append(table);
    return table;
  }

  extractLayerInfo(lambdaFuncInfo) {
    
    if(lambdaFuncInfo.Layers) {
      return lambdaFuncInfo.Layers.map((layer) => {

        const s = layer.Arn.split(':');
        const layerName = s[s.length-2];
        const layerVersion = s[s.length-1];
        
        return [
          layerName,
          layerVersion,
        ]
      });
    } else {
      return [["-","-"]];
    }
  }

  updateData(lambdaFuncInfo) {

    this.table.setData({
      headers: ["Name", "Version"],
      data: this.extractLayerInfo(lambdaFuncInfo)
    });
  }
}

module.exports = {
  LambdaLayersTable,
};
