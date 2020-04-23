import { invokeLambda } from "../services/invoke";
import { lambdaStatisticsModal } from "../modals/lambdaStatisticsModal";
import { DEPLOYMENT_STATUS } from "../constants";

const emoji = require("node-emoji");
const contrib = require("blessed-contrib");

class LambdaTable {
    constructor(layoutGrid, program, provider, profile, slsDevToolsConfig) {
        this.provider = provider;
        this.slsDevToolsConfig = slsDevToolsConfig;
        this.profile = profile;
        this.layoutGrid = layoutGrid;
        this.table = this.generateLambdaTable();
        this.fullFuncName = null;
        this.table.rows.on("select", (item) => {
            [this.funcName] = item.data;
            this.fullFuncName = `${program.stackName}-${this.funcName}`;
        });
        this.lambdasDeploymentStatus = {};
    }

    generateLambdaTable() {
        this.layoutGrid.set(0, 6, 4, 6, contrib.table, {
            keys: true,
            fg: "green",
            label: "Lambda Functions",
            columnSpacing: 1,
            columnWidth: [45, 30, 15],
            style: {
                border: {
                    fg: "yellow",
                },
            },
        });
    }

    updateLambdaData(lambdaFunctionResources) {
        this.table.data = lambdaFunctionResources.map((lam) => {
            const funcName = lam.PhysicalResourceId;
            const func = lambdaFunctions[funcName];
            let funcRuntime = "?";
            if (func) {
                funcRuntime = func.Runtime;
            }
            return [
                lam.PhysicalResourceId.replace(`${program.stackName}-`, ""),
                moment(lam.LastUpdatedTimestamp).format("MMMM Do YYYY, h:mm:ss a"),
                funcRuntime,
            ];
        });
    }

    flashLambdaTableRow(rowIndex) {
        this.table.rows.items[rowIndex].style.fg = "blue";
        this.table.rows.items[rowIndex].style.bg = "green";
    }

    unflashLambdaTableRow(rowIndex) {
        this.table.rows.items[rowIndex].style.fg = () =>
            rowIndex === this.table.rows.selected ? "white" : "green";
        this.table.rows.items[rowIndex].style.bg = () =>
            rowIndex === this.table.rows.selected ? "blue" : "default";
    }

    deployFunction() {
        const selectedRowIndex = this.table.rows.selected;
        if (selectedRowIndex !== -1) {
            const selectedLambdaFunctionName = this.table.rows.items[
                selectedRowIndex
            ].data[0];
            if (this.provider === "serverlessFramework") {
                exec(
                    `serverless deploy -f ${selectedLambdaFunctionName} -r ${
                    program.region
                    } --aws-profile ${profile} ${
                    this.slsDevToolsConfig ? this.slsDevToolsConfig.deploymentArgs : ""
                    }`,
                    { cwd: location },
                    (error, stdout) =>
                        this.handleFunctionDeployment(
                            error,
                            stdout,
                            selectedLambdaFunctionName,
                            selectedRowIndex
                        )
                );
            } else if (this.provider === "SAM") {
                console.error(
                    "ERROR: UNABLE TO DEPLOY SINGLE FUNCTION WITH SAM. PRESS s TO DEPLOY STACK"
                );
                return;
            }
            this.flashLambdaTableRow(selectedRowIndex);
            this.lambdasDeploymentStatus[selectedLambdaFunctionName] =
                DEPLOYMENT_STATUS.PENDING;
            this.updateLambdaTableRows();
        }
    }

    invokeLambda(lambda) {
        invokeLambda(lambda, this.fullFuncName);
    }

    handleStackDeployment(error, stdout) {
        if (error) {
            console.error(error);
            Object.keys(this.lambdasDeploymentStatus).forEach(
                // eslint-disable-next-line no-return-assign
                (functionName) =>
                    (this.lambdasDeploymentStatus[functionName] = DEPLOYMENT_STATUS.ERROR)
            );
        } else {
            console.log(stdout);
            Object.keys(this.lambdasDeploymentStatus).forEach(
                // eslint-disable-next-line no-return-assign
                (functionName) =>
                    (this.lambdasDeploymentStatus[functionName] =
                        DEPLOYMENT_STATUS.SUCCESS)
            );
        }
        this.table.data.forEach((v, i) => {
            this.unflashLambdaTableRow(i);
        });
        this.updateLambdaTableRows();
    }

    handleFunctionDeployment(error, stdout, lambdaName, lambdaIndex) {
        if (error) {
            console.error(error);
            this.lambdasDeploymentStatus[lambdaName] = DEPLOYMENT_STATUS.ERROR;
        } else {
            console.log(stdout);
            this.lambdasDeploymentStatus[lambdaName] = DEPLOYMENT_STATUS.SUCCESS;
        }
        this.unflashLambdaTableRow(lambdaIndex);
        this.updateLambdaTableRows();
    }

    updateLambdaDeploymentStatus() {
        Object.entries(this.lambdasDeploymentStatus).forEach(([key, value]) => {
            if (
                value === DEPLOYMENT_STATUS.SUCCESS ||
                value === DEPLOYMENT_STATUS.ERROR
            ) {
                this.lambdasDeploymentStatus[key] = undefined;
            }
        });
    }

    updateLambdaTableRows() {
        const lambdaFunctionsWithDeploymentIndicator = JSON.parse(
            JSON.stringify(this.table.data)
        );
        let deploymentIndicator;
        for (let i = 0; i < this.table.data.length; i++) {
            deploymentIndicator = null;
            switch (this.lambdasDeploymentStatus[this.table.data[i][0]]) {
                case DEPLOYMENT_STATUS.PENDING:
                    deploymentIndicator = emoji.get("coffee");
                    break;
                case DEPLOYMENT_STATUS.SUCCESS:
                    deploymentIndicator = emoji.get("sparkles");
                    break;
                case DEPLOYMENT_STATUS.ERROR:
                    deploymentIndicator = emoji.get("x");
                    break;
                default:
                    break;
            }
            if (deploymentIndicator) {
                lambdaFunctionsWithDeploymentIndicator[
                    i
                ][0] = `${deploymentIndicator} ${this.table.data[i][0]}`;
            }
        }

        this.table.setData({
            headers: ["logical", "updated", "runtime"],
            data: lambdaFunctionsWithDeploymentIndicator,
        });

        for (let i = 0; i < this.table.data.length; i++) {
            this.table.rows.items[i].data = this.table.data[i];
        }
    }

    deployStack() {
        if (this.provider === "serverlessFramework") {
            exec(
                `serverless deploy -r ${program.region} --aws-profile ${this.profile} ${
                this.slsDevToolsConfig ? this.slsDevToolsConfig.deploymentArgs : ""
                }`,
                { cwd: location },
                (error, stdout) => this.handleStackDeployment(error, stdout)
            );
        } else if (this.provider === "SAM") {
            exec("sam build", { cwd: location }, (error) => {
                if (error) {
                    console.error(error);
                    Object.keys(this.lambdasDeploymentStatus).forEach(
                        // eslint-disable-next-line no-return-assign
                        (functionName) =>
                            (this.lambdasDeploymentStatus[functionName] =
                                DEPLOYMENT_STATUS.ERROR)
                    );
                } else {
                    exec(
                        `sam deploy --region ${
                        program.region
                        } --profile ${profile} --stack-name ${program.stackName} ${
                        this.slsDevToolsConfig ? this.slsDevToolsConfig.deploymentArgs : ""
                        }`,
                        { cwd: location },
                        (deployError, stdout) =>
                            this.handleStackDeployment(deployError, stdout)
                    );
                }
            });
        }
        this.table.data.forEach((v, i) => {
            this.flashLambdaTableRow(i);
            this.lambdasDeploymentStatus[this.table.rows.items[i].data[0]] =
                DEPLOYMENT_STATUS.PENDING;
        });
        this.updateLambdaTableRows();
    }

    openLambdaInAWSConsole() {
        const selectedLambdaFunctionName = this.table.rows.items[
            this.table.rows.selected
        ].data[0];
        return open(
            `https://${program.region}.console.aws.amazon.com/lambda/home?region=${program.region}#/functions/${program.stackName}-${selectedLambdaFunctionName}?tab=configuration`
        );
    }

    openLambdaStatisticsModal(application, screen, cloudwatch, cloudwatchLogs) {
        application.isModalOpen = true;
        const selectedRow = this.table.rows.selected;
        const [selectedLambdaName] = this.table.rows.items[
            selectedRow
        ].data;
        const fullFunctionName = `${program.stackName}-${selectedLambdaName}`;
        return lambdaStatisticsModal(
            screen,
            this,
            fullFunctionName,
            cloudwatchLogs,
            cloudwatch,
            this.lambda
        );
    }
}

module.exports = {
    LambdaTable,
}
