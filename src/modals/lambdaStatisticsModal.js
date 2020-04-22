import { DurationBarChart } from "../components/durationBarChart";
import { ErrorDonutChart } from "../components/errorDonutChart";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { getLambdaMetrics } from "../services/lambdaMetrics";
import { InvocationCountLCD } from "../components/invocationCountLCD";
import { LambdaDeploymentsTable } from "../components/lambdaDeploymentsTable";

const lambdaStatisticsModal = async (
  screen,
  application,
  lambdaName,
  cloudwatchLogs,
  cloudwatch,
  lambda
) => {
  const lambdaStatisticsLayout = new ModalLayout(screen, 112, 39, false);
  new Box(lambdaStatisticsLayout, 110, 3, `Lambda Statistics - ${lambdaName}`);
  const durationChartBox = new Box(lambdaStatisticsLayout, 55, 17);
  const errorChartBox = new Box(lambdaStatisticsLayout, 55, 17);
  const invocationCountBox = new Box(lambdaStatisticsLayout, 55, 17);
  const lambdaDeploymentsTableBox = new Box(lambdaStatisticsLayout, 55, 17);
  const durationChart = new DurationBarChart(
    application,
    cloudwatchLogs,
    false,
    durationChartBox
  );
  const errorChart = new ErrorDonutChart(
    application,
    errorChartBox,
    cloudwatch
  );
  const invocationCount = new InvocationCountLCD(invocationCountBox);
  const lambdaDeploymentsTable = new LambdaDeploymentsTable(
    lambdaDeploymentsTableBox,
    lambda
  );
  const metrics = await getLambdaMetrics(application, lambdaName, cloudwatch);
  invocationCount.updateData(metrics);
  errorChart.updateData(metrics);
  durationChart.updateData(lambdaName);
  lambdaDeploymentsTable.updateData(lambdaName);
  lambdaStatisticsLayout.focus();
  lambdaStatisticsLayout.key(["escape"], () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    lambdaStatisticsLayout.destroy();
  });
};

module.exports = {
  lambdaStatisticsModal,
};
