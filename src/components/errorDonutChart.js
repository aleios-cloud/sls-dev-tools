const contrib = require("blessed-contrib");
import { getLambdaMetrics } from '../services/lambdaMetrics';

class ErrorDonutChart {
    constructor(application, layout, cloudwatch) {
        this.application = application;
        this.layout = layout;
        this.chart = this.generateChart();
        this.cloudwatch = cloudwatch;
    }
    generateChart() {
        const donutChart = contrib.donut({
            label: 'Error/Invocation ratio',
            radius: 25,
            arcWidth: 10,
            remainColor: 'green',
        });
        this.layout.append(donutChart);
        return donutChart;
    }
    async updateData(lambdaName) {
        const metrics = await getLambdaMetrics(this.application, lambdaName, this.cloudwatch);
        const invocationCount = metrics.MetricDataResults[1].Values.reduce(
            (count, numberOfInvocationsOnPeriod) => count + numberOfInvocationsOnPeriod, 0
        );
        const errorCount = metrics.MetricDataResults[0].Values.reduce(
            (count, numberOfErrorsOnPeriod) => count + numberOfErrorsOnPeriod, 0
        );
        if (invocationCount == 0) {
            this.chart.update([
                { percent: 0, label: 'Errors/Invocations', color: 'red' }
            ])
        } else {
            this.chart.update([
                { percent: Math.round(errorCount / invocationCount * 100), label: 'Errors/Invocations', color: 'red' }
            ])
        }
    }
}

module.exports = {
    ErrorDonutChart
};
