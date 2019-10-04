---
id: README
title: Installation and use
sidebar_label: Installation and use
---
# sls-dev-tools
The Chrome Dev Tools for the Serverless World

⚠ Still in early POC stages, stable Alpha release expected in next weeks. ⚠

![demo](assets/demo.png)

# To Run

- Run `git clone git@github.com:Theodo-UK/sls-dev-tools.git && cd sls-dev-tools`
- Run `yarn dev`
- Then `yarn start -n {YOUR_STACK_NAME} -r {YOUR_REGION} [-t {START_TIME}]`
- If this doesn't work, have a look on AWS and see what your stack is called as it may be a different name than you expect, e.g. with `-dev` on the end
- Try to choose a function with the arrow keys and enter to see the metrics. You may get an `AccessDenied` error in which case you must add the `GetMetricData` permission from CloudWatch in the IAM console on AWS.

# Build

- `yarn build`

# Libs

Heavily based off the amazing [blessed](https://github.com/chjj/blessed) and [blessed-contrib](https://github.com/yaronn/blessed-contrib) projects.

## Core Team

| [Ben Ellerby](https://github.com/BenEllerby) | [Abbie Howell](https://github.com/abbiehowell) | [Rob Cronin](https://github.com/robcronin) |
|---|---|---|
| ![Ben Ellerby](https://avatars2.githubusercontent.com/u/11080984?s=150) | ![Abbie Howell](https://avatars3.githubusercontent.com/u/41898453?s=150) | ![Rob Cronin](https://avatars3.githubusercontent.com/u/32868346?s=150) |
