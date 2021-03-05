import fs from "fs";

import { TEST_JSON } from "./constants";
import loadConfig from "../serverlessConfigParser";

const TEST_YAML_FILE_EMPTY = "";
const TEST_YAML_FILE = `
service:
  name: test-\${opt:testArg1}

provider:
  name: aws
  runtime: nodejs10.x
  region: eu-west-1
  stage: \${opt:stage, 'dev'}

functions:
  hello:
    handler: hello.main
    memorySize: 1024
    timeout: 6
    events:
      - http:
          method: get
          path: hello
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
`;
const TEST_YAML_DEFAULT_STACKNAME = `
service: test-\${opt:testArg1}

provider:
  name: aws
  runtime: nodejs10.x
  region: eu-west-1
  stage: \${opt:stage, 'dev'}
`;

const TEST_YAML_FILE_REF = `
service:
  name: test-\${opt:testArg1}

provider:
  name: aws
  runtime: nodejs10.x
  region: eu-west-1
  stage: \${opt:stage, 'dev'}

functions:
  hello:
    handler: hello.main
    memorySize: 1024
    timeout: 6
    events:
      - http:
          method: get
          path: hello
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId: !Ref ApiGatewayAuthorizer
`;

// eslint-disable-next-line no-template-curly-in-string
const STACK_NAME_OPT = "test-${opt:testArg1}";
// eslint-disable-next-line no-template-curly-in-string
const STACK_NAME_MANY_OPTS = "test-${opt:testArg1}-${opt:testArg2}";
const STACK_NAME_MANY_NO_OPTS = "test-backend-arg2";
const STACK_NAME_NO_OPT = "test-backend";
const CMD_VAR_1 = "--testArg1";
const CMD_VAL_1 = "backend";
const CMD_VAR_2 = "-testArg2";
const CMD_VAL_2 = "arg2";
const INVALID_ARGUMENT_EXIT_CODE = 9;

jest.mock("fs");

describe("Serverless Config Parser", () => {
  it("should find read and parse a valid json serverless config file", () => {
    fs.readFileSync.mockReturnValue(TEST_JSON.test);
    fs.existsSync.mockReturnValue(true);

    const test = { args: [], location: "~/Dev/test/backend" };

    return loadConfig(test).then((res) => {
      expect(res).toStrictEqual(TEST_JSON.result);
    });
  });
});
