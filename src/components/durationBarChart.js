import { getLogEvents } from "../services/awsCloudwatchLogs";

const contrib = require("blessed-contrib");

class DurationBarChart {
  constructor(application, cloudwatchLogs, isInGridLayout, layout) {
    this.application = application;
    this.cloudwatchLogs = cloudwatchLogs;
    this.isInGridLayout = isInGridLayout;
    this.layout = layout;
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

  checkForErrors(events) {
    let latestErrorId = "";
    events.forEach((event) => {
      if (event.message.includes("ERROR")) {
        latestErrorId = event.eventId;
      }
    });
    if (latestErrorId !== this.application.prevErrorId) {
      this.application.setPrevErrorId(latestErrorId);
      if (this.application.firstLogsRetrieved) {
        console.log(`Error id is ${latestErrorId}`);
      }
    }
    this.application.setFirstLogsRetrieved(true);
  }

  async updateData(lambdaName) {
    const logGroupName = `/aws/lambda/${lambdaName}`;
    const events = await getLogEvents(logGroupName, this.cloudwatchLogs);

    if (events.length === 0) {
      this.application.lambdaLog.setContent(
        "ERROR: No log streams found for this function."
      );
    } else {
      this.application.lambdaLog.setContent("");
      events.forEach((event) => {
        this.application.lambdaLog.log(event.message);
      });
    }

    this.setBarChartDataFromLogContent(this.application.lambdaLog.content);
    this.checkForErrors(events);
  }
}

module.exports = {
  DurationBarChart,
};
