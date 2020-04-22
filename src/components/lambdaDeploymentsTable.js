const contrib = require("blessed-contrib");

class LambdaDeploymentsTable {
    constructor(parent, lambda, lambdaName) {
        this.parent = parent;
        this.lambda = lambda;
        this.lambdaName = lambdaName;
        this.table = this.generateTable();
    }

    generateTable() {
        const table = contrib.table({
            fg: 'white',
            interactive: false,
            label: 'Deployment History',
            columnWidth: [10, 40],
            padding: { top: 1 }
        })
        this.parent.append(table);
        return table;
    }

    updateData(lambdaName) {
        const listVersionsByFunctionParams = {
            FunctionName: lambdaName
        };
        this.lambda.listVersionsByFunction(listVersionsByFunctionParams, (err, data) => {
            if (err) {
                console.log(err, err.stack);
            } else {
                const versions = data.Versions;
                this.table.setData({
                    headers: ['Version', 'Date'],
                    data: versions.map((version) => [version.Version, version.LastModified])
                });
            }
        })
    }
}

module.exports = {
    LambdaDeploymentsTable,
}