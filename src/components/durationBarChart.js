const durationBarChartOptions = {
  barWidth: 6,
  label: 'Lambda Duration (ms) (most recent)',
  barSpacing: 6,
  xOffset: 2,
  maxHeight: 9,
};

const updateBarChartData = (lambdaInfoBar, lambdaLog) => {
    console.log("updating barchart...")
    const regex = /RequestId:(\s)*(\w|-)*(\s)*Duration:(\s)*(\d|\.)*(\s)*ms/gm;
    // Extract reports from the server logs
    const matches = lambdaLog.content.match(regex);
    const splits = [];
    if (matches !== null) {
      for (let i = 0; i < matches.length; i++) {
        // Split report into fields using tabs (or 4 spaces)
        splits.push(matches[i].split(/\t|\s\s\s\s/));
      }
      lambdaInfoBar.setData({
        titles: ['1', '2', '3', '4', '5'],
        // Extract numerical value from field by splitting on spaces, and taking second value
        data: splits.map((s) => s[1].split(' ')[1]).slice(-5),
      });
    }
    console.log("done");
  }

module.exports = {
  durationBarChartOptions,
  updateBarChartData,
};