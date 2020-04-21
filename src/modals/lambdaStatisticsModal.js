import { DurationBarChart } from '../components/durationBarChart';
import { ErrorDonutChart } from '../components/errorDonutChart';
import { Box } from '../components/box';
import { ModalLayout } from '../components/modalLayout';

const lambdaStatisticsModal = (screen, application, lambdaName, cloudwatchLogs, cloudwatch) => {
    const lambdaStatisticsLayout = new ModalLayout(screen, 112, 27, false);
    new Box(lambdaStatisticsLayout, 110, 3, `Lambda Statistics - ${lambdaName}`);
    const durationChartBox = new Box(lambdaStatisticsLayout, 55, 22);
    const errorChartBox = new Box(lambdaStatisticsLayout, 55, 22);
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
