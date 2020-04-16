import { durationBarChartOptions, updateBarChartData } from '../components/durationBarChart';

const lambdaStatisticsModal = (screen, contrib, blessed, application, lambdaName) => {
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
  const durationChartBox = blessed.box({
    parent: lambdaStatisticsLayout,
    width: 54,
    height: 25,
    left: 'right',
    top: 'center',
    align: 'center',
    padding: { left: 2, right: 2 },
    border: 'line',
    style: { fg: 'green', border: { fg: 'green' } },
  });
  var durationChart = contrib.bar(durationBarChartOptions);
  durationChartBox.append(durationChart);
  application.getLogStreams(`/aws/lambda/${lambdaName}`).then((logs) => {
    console.log("updatingChart...");
    updateBarChartData(durationChart, logs);
  });
  lambdaStatisticsLayout.focus();
  setInterval(() => {
    console.log("interval");
    
    screen.render();
  }, 1000);
  lambdaStatisticsLayout.key(['escape'], () => {
    application.setIsModalOpen(false);
    application.returnFocus();
    lambdaStatisticsLayout.destroy();
  });
};
  
module.exports = {
  lambdaStatisticsModal,
};
  