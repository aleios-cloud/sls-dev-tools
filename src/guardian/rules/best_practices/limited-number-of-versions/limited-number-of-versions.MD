# Functions should have less than 3 versions

It is most of the time useless to keep more than 3 online versions for your lambdas.
Storing useless data has a negative impact on teh environment. (For more info, see https://www.notion.so/m33/Serverless-Sustainability-Audit-a36847289fd64339a60e40bc5aa63092?p=a0471b2c407144fe839150326ed804d8)

AWS Lambda service furthermore has limited storage space, which can be easily reached if you keep every single version of your lambdas.

---

## Suggested Actions

- Use [serverless-prune-versions](https://github.com/manwaring/serverless-prune-versions) to regularly prune the versions of the affected lambdas
