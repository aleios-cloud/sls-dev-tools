---
id: no-max-memory
title: no-max-memory
sidebar_label: no-max-memory
---

# No Functions Have Memory Configuration To Maximum Limit (no-max-memory)

Lambda Functions memory is configurable and should be configured for the use-case.
This can impact the speed and running cost of the Lambda Function.

> **Note:** Any increase in memory size triggers an equivalent increase in CPU available to your function

---

## Suggested Actions:

- Look into your CloudWatch Logs for the Lambda function to find `Max Memory Used` [more information](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)

```
REPORT RequestId: 3604209a-e9a3-11e6-939a-754dd98c7be3	Duration: 12.34 ms	Billed Duration: 100 ms Memory Size: 128 MB	Max Memory Used: 18 MB
```

- Power-tune using [aws-lambda-power-tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
