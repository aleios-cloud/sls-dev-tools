# sls-dev-tools
The Chrome Dev Tools for the Serverless World

⚠ Still in early POC stages, stable Alpha release expected in next weeks. ⚠

![demo](./demo.png)

# To Run

- Run `yarn watch`
- Then `yarn start {YOUR_STACK} {YOUR_REGION}`

# Build

- `yarn build`


# A note on AWS API calls and pricing

This tool does make use of the AWS API to get metrics. Authentication is handled implicitly via the AWS NodeJS SDK. Pricing around Cloudwatch is designed for scale, but be warned that this tool is making calls to AWS.

Full details on AWS API pricing can be found here:
- https://aws.amazon.com/cloudwatch/pricing/

For instance, the cost of GetMeticData as of 25/08/19 was $0.01 per 1,000 metrics requested.
- This tool take no liability in pricing data provided and please use AWS's docs to ensure pricing is appropriate for you.

The current list of calls made by the tool:

- CloudFormation: listStackResources
- CloudWatch: getMetricData
- More may be added, check code for full list



Heavily based off the amazing [blessed](https://github.com/chjj/blessed) and [blessed-contrib](https://github.com/yaronn/blessed-contrib) projects.

## Core Team

| [Ben Ellerby](https://github.com/BenEllerby)                            | [Rob Cronin](https://github.com/robcronin)                            |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------|
| ![Ben Ellerby](https://avatars2.githubusercontent.com/u/11080984?s=150) | ![Rob Cronin](https://avatars3.githubusercontent.com/u/32868346?s=150) |
