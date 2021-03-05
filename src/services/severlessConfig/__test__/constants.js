export const TEST_JSON = {
  test: `
{
  "service": "test-backend",
  "provider": {
    "name": "aws",
    "runtime": "nodejs10.x",
    "region": "eu-west-1"
  }
}
`,
  result: {
    service: "test-backend",
    provider: {
      name: "aws",
      runtime: "nodejs10.x",
      region: "eu-west-1",
      stage: "dev",
    },
  },
};
