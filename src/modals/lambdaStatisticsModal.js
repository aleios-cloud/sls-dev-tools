import { DurationBarChart } from "../components/durationBarChart";
import { ErrorDonutChart } from "../components/errorDonutChart";
import { Box } from "../components/box";
import { ModalLayout } from "../components/modalLayout";
import { getLambdaMetrics } from "../services/lambdaMetrics";
import { InvocationCountLCD } from "../components/invocationCountLCD";
import { LambdaDeploymentsTable } from "../components/lambdaDeploymentsTable";
import { LambdaLayersTable } from "../components/lambdaLayersTable";

const lambdaStatisticsModal = async (
  screen,
  application,
  lambdaName,
  cloudwatchLogs,
  cloudwatch,
  lambda,
  lambdaFuncInfo
) => {
  const lambdaStatisticsLayout = new ModalLayout(screen, 112, 50, false);
  new Box(lambdaStatisticsLayout, 110, 3, `Lambda Statistics - ${lambdaName}`);
  const durationChartBox = new Box(lambdaStatisticsLayout, 55, 17);
  const errorChartBox = new Box(lambdaStatisticsLayout, 55, 17);
  const invocationCountBox = new Box(lambdaStatisticsLayout, 55, 17);
  const lambdaDeploymentsTableBox = new Box(lambdaStatisticsLayout, 55, 17);
  const lambdaLayersBox = new Box(lambdaStatisticsLayout, 55, 11);
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

  const lambdaLayersTable = new LambdaLayersTable( 
    lambdaLayersBox,
    lambdaFuncInfo
  );

  const metrics = await getLambdaMetrics(application, lambdaName, cloudwatch);
  invocationCount.updateData(metrics);
  errorChart.updateData(metrics);
  durationChart.updateData(lambdaName);
  lambdaDeploymentsTable.updateData(lambdaName);
  lambdaLayersTable.updateData(lambdaFuncInfo);
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
