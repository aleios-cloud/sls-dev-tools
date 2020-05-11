const contrib = require("blessed-contrib");

class InvocationCountLCD {
  constructor(parent, width, height, numberOfDigits = 4) {
    this.parent = parent;
    this.numberOfDigits = numberOfDigits;
    this.width = width;
    this.height = height;
    this.lcd = this.generateLCD();
  }

  generateLCD() {
    const lcd = contrib.lcd({
      segmentWidth: 0.06,
      segmentInterval: 0.11,
      strokeWidth: 0.11,
      elements: this.numberOfDigits + 1,
      display: 0,
      elementSpacing: 4,
      elementPadding: 5,
      color: "green",
      label: "Invocations the past 12 hrs",
      border: "line",
      style: { fg: "green", border: { fg: "green" } },
      width: this.width,
      height: this.height,
    });
    this.parent.append(lcd);
    return lcd;
  }

  updateData(metrics) {
    const invocationCount = metrics.MetricDataResults[1].Values.reduce(
      (count, numberOfInvocationsOnPeriod) =>
        count + numberOfInvocationsOnPeriod,
      0
    );
    const limitNumber = 10 ** this.numberOfDigits - 1;
    if (invocationCount > limitNumber) {
      this.lcd.setDisplay(`${limitNumber}+`);
    } else {
      this.lcd.setDisplay(invocationCount);
    }
  }
}

module.exports = {
  InvocationCountLCD,
};
