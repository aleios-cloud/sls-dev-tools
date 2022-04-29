# All functions have an arm64 architecture

Lambdas Functions default architecture is x86_64 but should be configure to arm64.
Lambda functions that use arm64 architecture (AWS Graviton2 processor) can achieve significantly better price and performance than the equivalent function running on x86_64 architecture.

---

## Suggested Actions:

- Look into your function in your Lambda service to find `Architectures` in the code tab Runtime Settings. [more information](https://docs.aws.amazon.com/lambda/latest/dg/foundation-arch.html#foundation-arch-adv)
