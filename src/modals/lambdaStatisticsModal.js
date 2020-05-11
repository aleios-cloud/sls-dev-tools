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
  const durationChart = new DurationBarChart(
    application,
    cloudwatchLogs,
    false,
    lambdaStatisticsLayout,
    55,
    15
  );
  const errorChart = new ErrorDonutChart(
    application,
    lambdaStatisticsLayout,
    cloudwatch,
    55,
    15
  );
  const invocationCount = new InvocationCountLCD(
    lambdaStatisticsLayout,
    55,
    15
  );
  const lambdaDeploymentsTable = new LambdaDeploymentsTable(
    lambdaStatisticsLayout,
    lambda,
    55,
    15
  );
  const lambdaLayersTable = new LambdaLayersTable(
    lambdaStatisticsLayout,
    55,
    11
  );
  new Box(lambdaStatisticsLayout, 110, 4, "ESC to close");

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
