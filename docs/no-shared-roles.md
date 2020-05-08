---
id: no-shared-roles
title: no-shared-roles
sidebar_label: no-shared-roles
---

# No Functions Have Shared IAM Roles (no-shared-roles)

IAM Roles allow granular access control to be specified per function.
To ensure least privilege, one role should be used per function so that the underlying policy can be configured correctly.

---

## Suggested Actions:

- Define one IAM Role per Function and configure them to ensure least privilege.
- If you're using the Serverless Framework, you can use the [serverless-iam-roles-per-function](https://github.com/functionalone/serverless-iam-roles-per-function) plugin.
