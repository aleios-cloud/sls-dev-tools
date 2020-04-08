# sls-dev-tools
[![npm](https://img.shields.io/npm/v/sls-dev-tools)](https://www.npmjs.com/package/sls-dev-tools)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Theodo-UK/sls-dev-tools/blob/master/LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Theodo-UK/sls-dev-tools)

The Dev Tools for the Serverless World

[Docs Site](https://theodo-uk.github.io/sls-dev-tools)

![demo](./demo.png)

[Documentation](https://theodo-uk.github.io/sls-dev-tools)

# To Run

- `npm install -g sls-dev-tools`
- Run `sls-dev-tools -n {YOUR_STACK_NAME} -r {YOUR_REGION} [-t {START_TIME}] [-i {INTERVAL}] [-p {PROFILE}] [-l {YOUR_PROJECT_LOCATION}]`
  - The start time defines when you want your graphs to start from. The format for the start time is as follows: `'30 March 2020 09:00 GMT'`
  - The interval defines the size of the buckets in seconds. This means if you give a interval of 3600, the line graph will group the invocations and errors into 1h chunks, and the bar chart will show the average response time over the hour for the last 6 hours during which invocations were made.
  - The profile option allows you to pass in an alternative aws profile to connect with if none is provided the default aws profile is used
  - Run sls-dev-tools within your serverless project or specify its location in the command to enable the deployment features.
  - To get the stack name, log on to AWS cloudformation and it is shown in the overview section of stack info. It may not be what you expected e.g. it might have `-dev` on the end, so worth checking if the dev tools are not working.
  - The region is the AWS region, for example, us-east-1.
  - Use --sls or --sam to specify the framework used to execute commands (the serverless framework is used by default if no option is provided)
  - For deployments using the sam framework extra arguments for capabilites and s3 bucket must be added in the slsdevtools.config.js e.g. `--capabilities CAPABILITY_IAM --s3-bucket deployment-bucket-name` [Example SLS Dev Tools Config](slsdevtools.config.js.dist)
- Choose a function with the arrow keys, and press enter to see the metrics for that function.
  - If you get an `AccessDenied` error in which case you must add the `GetMetricData` permission from CloudWatch in the IAM console on AWS.
  - If you're not seeing any data in the graphs, try changing your start date to make sure you have had invocations since then.
- The EventBridge pane allows you to view event buses in your region, and send events to each bus from a template editor.
- Switch focus between lambda functions and event buses by pressing tab.
- The line graph shows the number of invocations and errors that occurred within the time interval.
- The bar chart shows the response time of 5 most recent invocations.

```
Options:
  -V, --version                 output the version number
  -n, --stack-name <stackName>  AWS stack name
  -r, --region <region>         AWS region
  -t, --start-time <startTime>  when to start from
  -i, --interval <interval>     interval of graphs, in seconds
  -p, --profile <profile>       aws profile name to use
  -h, --help                    output usage information
  -l, --location                location of your serverless project (default is current directory)
  --sls                         use the serverless framework to execute commands
  --sam                         use the SAM framework to execute commands
```

```
Shortcuts
- Pressing "h" while the tool is open will display a helpbox with all the keybindings and cli options
- Pressing "q" will quit the tool
- Pressing "o" while selecting a function from the function list will open the relevant page of the AWS console (saving some clicks!)
- Pressing "d" while selecting a function from the function list will deploy the selected lambda function, note this is not possible while using SAM
- Pressing "s" while selecting a function will deploy the entire stack
- Pressing "i" while selecting an event bus will open a window to write and inject an event for that bus
```

# A note on AWS API calls and pricing	

This tool does make use of the AWS API to get metrics. Authentication is handled implicitly via the AWS NodeJS SDK. Pricing around Cloudwatch is designed for scale, but be warned that this tool is making calls to AWS.	

Full details on AWS API pricing can be found here:	
- https://aws.amazon.com/cloudwatch/pricing/	

For instance, the cost of GetMetricData as of 25/08/19 was $0.01 per 1,000 metrics requested.	
- This tool take no liability in pricing data provided and please use AWS's docs to ensure pricing is appropriate for you.	

The current list of calls made by the tool:	

- CloudFormation: listStackResources	
- CloudWatch: getMetricData	
- CloudWatchLogs: describeLogStreams, filterLogEvents	
- More may be added, check code for full list

# Libs

Heavily based off the amazing [blessed](https://github.com/chjj/blessed) and [blessed-contrib](https://github.com/yaronn/blessed-contrib) projects.

## Core Team

| [Ben Ellerby](https://github.com/BenEllerby) | [Abbie Howell](https://github.com/abbiehowell) | [Rob Cronin](https://github.com/robcronin) | [Gavin Williams](https://github.com/DotGav) | [Antoine Eudes](https://github.com/antoineeudes) | [Mansur Pasha](https://github.com/mansurpasha) | [Luc Esplin](https://github.com/luce-theodo) |
|---|---|---|---|---|---|---|
| ![Ben Ellerby](https://avatars2.githubusercontent.com/u/11080984?s=150) | ![Abbie Howell](https://avatars3.githubusercontent.com/u/41898453?s=150) | ![Rob Cronin](https://avatars3.githubusercontent.com/u/32868346?s=150) | ![Gavin Williams](https://github.com/DotGav.png?size=150) | ![Antoine Eudes](https://avatars3.githubusercontent.com/u/13795384?s=150) | ![Mansur Pasha](https://github.com/mansurpasha.png?size=150) | ![Luc Esplin](https://github.com/luce-theodo.png?size=150) |
