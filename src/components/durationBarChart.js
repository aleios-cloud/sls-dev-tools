const contrib = require("blessed-contrib");

class DurationBarChart {
  constructor(
    application,
    cloudwatchLogs,
    isInGridLayout,
    layout,
    width,
    height
  ) {
    this.application = application;
    this.cloudwatchLogs = cloudwatchLogs;
    this.isInGridLayout = isInGridLayout;
    this.layout = layout;
    this.width = width;
    this.height = height;
    this.chart = this.generateChart();
  }

  generateChart() {
    const durationBarChartOptions = {
      barWidth: 6,
      label: "Lambda Duration (ms) (most recent)",
      barSpacing: 6,
      xOffset: 2,
      maxHeight: 9,
    };
    if (this.isInGridLayout) {
      return this.application.layoutGrid.set(
        4,
        6,
        4,
        3,
        contrib.bar,
        durationBarChartOptions
      );
    }
    durationBarChartOptions.width = this.width;
    durationBarChartOptions.height = this.height;
    durationBarChartOptions.border = "line";
    durationBarChartOptions.style = { fg: "green", border: { fg: "green" } };
    const durationBarChart = contrib.bar(durationBarChartOptions);
    if (this.layout) {
      this.layout.append(durationBarChart);
    }
    return durationBarChart;
  }

  setBarChartDataFromLogContent(lambdaLogContent) {
    const regex = /RequestId:(\s)*(\w|-)*(\s)*Duration:(\s)*(\d|\.)*(\s)*ms/gm;
    // Extract reports from the server logs
    const matches = lambdaLogContent.match(regex);
    const splits = [];
    if (matches !== null) {
      for (let i = 0; i < matches.length; i++) {
        // Split report into fields using tabs (or 4 spaces)
        splits.push(matches[i].split(/\t|\s\s\s\s/));
      }
      this.chart.setData({
        titles: ["1", "2", "3", "4", "5"],
        // Extract numerical value from field by splitting on spaces, and taking second value
        data: splits.map((s) => s[1].split(" ")[1]).slice(-5),
      });
    }
  }

  async updateData() {
    this.setBarChartDataFromLogContent(this.application.lambdaLog.content);
  }
}

module.exports = {
  DurationBarChart,
};
