---
id: no-identical-code
title: no-identical-code
sidebar_label: no-identical-code
---

# No Functions Have Identical Deployment Code (no-identical-code)

Lambda Function should have their code packaged optimally as it may affect cold start times.
Also, deploying a monolithic codebase is not advised.

---

## Suggested Actions:

- Look at your deployment artifact to see if there is code that should be removed.
- If you're using the Serverless Framework specify individual packaging [more info](https://www.serverless.com/framework/docs/providers/aws/guide/packaging/):

```
service: my-service

package:
  individually: true

```

- Use the `serverless package` command if you use the serverless framework.
  - Look in the `.serverless` directory to see the deployment artifacts.
