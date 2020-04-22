const contrib = require('blessed-contrib');

class InvocationCountLCD {
    constructor(parent, numberOfDigits = 3) {
        this.parent = parent;
        this.numberOfDigits = numberOfDigits;
        this.lcd = this.generateLCD();
    }
    generateLCD() {
        const lcd = contrib.lcd({
            segmentWidth: 0.06,
            segmentInterval: 0.11,
            strokeWidth: 0.11,
            elements: this.numberOfDigits,
            display: 0,
            elementSpacing: 4,
            elementPadding: 5,
            color: 'green',
            label: 'Invocations the past 12 hrs',
        });
        this.parent.append(lcd);
        return lcd;
    }
    updateData(metrics) {
        const invocationCount = metrics.MetricDataResults[1].Values.reduce(
            (count, numberOfInvocationsOnPeriod) => count + numberOfInvocationsOnPeriod, 0
        );
        const limitNumber = Math.pow(10, this.numberOfDigits) - 1;
        if (invocationCount > limitNumber) {
            limitNumber.concat(limitNumber);
            this.lcd.setDisplay(limitNumber.concat("+"));
        } else {
            this.lcd.setDisplay(invocationCount);
        }
    }
}

module.exports = {
    InvocationCountLCD,
}