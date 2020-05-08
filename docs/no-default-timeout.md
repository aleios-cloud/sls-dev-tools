---
id: no-default-timeout
title: no-default-timeout
sidebar_label: no-default-timeout
---

# No Functions Have Timeout Configuration Left as Default (no-default-timeout)

Lambda Function timeout is configurable and should be configured for the use-case.
This can impact timeout errors, running costs and security (e.g. "Denial of Wallet").
The default is 3 seconds in AWS, but 6 with the Serverless Framework.
The maximum allowed value is 900 seconds.

< 5 seconds is generally suitable for API endpoints.

> **Note:** API Gateway has a limit of 29 seconds.

---

## Suggested Actions:

- Look into your CloudWatch Logs for the Lambda function to find `Duration` ([more information](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html))

```
REPORT RequestId: 3604209a-e9a3-11e6-939a-754dd98c7be3	Duration: 12.34 ms	Billed Duration: 100 ms Memory Size: 128 MB	Max Memory Used: 18 MB
```

- Power-tune using [aws-lambda-power-tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
  > **Note:** Any increase in memory size triggers an equivalent increase in CPU available to your function, which can be useful in lowering timeout.
