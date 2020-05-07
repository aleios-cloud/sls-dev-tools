---
id: no-max-timeout
title: no-max-timeout
sidebar_label: no-max-timeout
---

# No Functions Have Timeout Configuration To Maximum Limit (no-max-timeout)

Lambda Function timeout is configurable and should be configured for the use-case.
Having it set at the maximum is rarely appropriate, unless processing a lot of data.
The default is 3 seconds in AWS, but 6 with the Serverless Framework.
The maximum allowed value is 900 seconds.

Having it set at the maximum can allow inefficient code to be released, increased billed duration in case of code errors and can lead to expensive cloud bills via "Denial of Wallet" attacks.

< 5 seconds is generally suitable for API endpoints.

---

## Suggested Actions:

- Look into your CloudWatch Logs for the Lambda function to find `Duration` ([more information](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html))

```
REPORT RequestId: 3604209a-e9a3-11e6-939a-754dd98c7be3	Duration: 12.34 ms	Billed Duration: 100 ms Memory Size: 128 MB	Max Memory Used: 18 MB
```

- Power-tune using [aws-lambda-power-tuning](https://github.com/alexcasalboni/aws-lambda-power-tuning)
  > **Note:** Any increase in memory size triggers an equivalent increase in CPU available to your function, which can be useful in lowering timeout.
