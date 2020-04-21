import { DurationBarChart } from '../components/durationBarChart';
import { ErrorDonutChart } from '../components/errorDonutChart';

const lambdaStatisticsModal = (screen, blessed, application, lambdaName, cloudwatchLogs, cloudwatch) => {
    const lambdaStatisticsLayout = blessed.layout({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 112,
        height: 27,
        border: 'line',
        style: { border: { fg: 'green' } },
        keys: true,
    });
    blessed.box({
        parent: lambdaStatisticsLayout,
        width: 110,
        height: 3,
        left: "right",
        top: "center",
        align: "center",
        padding: { left: 2, right: 2 },
        border: "line",
        style: { fg: "green", border: { fg: "green" } },
        content: `Lambda Statistics - ${lambdaName}`,
    });
    const durationChartBox = blessed.box({
        parent: lambdaStatisticsLayout,
        width: 55,
        height: 22,
        left: 'right',
        top: 'center',
        align: 'center',
        padding: { left: 2, right: 2 },
        border: 'line',
        style: { fg: 'green', border: { fg: 'green' } },
    });
    const errorChartBox = blessed.box({
        parent: lambdaStatisticsLayout,
        width: 55,
        height: 22,
        left: 'right',
        top: 'center',
        align: 'center',
        padding: { right: 2, left: 2 },
        border: 'line',
        style: { fg: 'green', border: { fg: 'green' } },
    });
    const durationChart = new DurationBarChart(application, cloudwatchLogs, false, durationChartBox)
    const errorChart = new ErrorDonutChart(application, errorChartBox, cloudwatch);
    durationChart.updateData(lambdaName);
    errorChart.updateData(lambdaName);
    lambdaStatisticsLayout.focus();
    lambdaStatisticsLayout.key(['escape'], () => {
        application.setIsModalOpen(false);
        application.returnFocus();
        lambdaStatisticsLayout.destroy();
    });
};

module.exports = {
    lambdaStatisticsModal,
};
