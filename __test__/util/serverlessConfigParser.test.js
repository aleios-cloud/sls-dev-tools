import fs from "fs";

import {
  transformArgsToDict,
  replaceStacknameOpt,
  CYAN_STRING_FORMAT,
} from "../../src/services/severlessConfigParser/helpers";
import ServerlessConfigParser from "../../src/services/severlessConfigParser/serverlessConfigParser";

const TEST_YAML_FILE = `
service:
  name: test-\${opt:testArg1}

package:
  exclude:
    - .git/**
    - .gitignore

plugins:
  - serverless-webpack

provider:
  name: aws
  runtime: nodejs10.x
  region: eu-west-1
  stage: \${opt:stage, 'dev'}
  usagePlan:
    quota:
      limit: 5000
      offset: 2
      period: MONTH
    throttle:
      burstLimit: 200
      rateLimit: 100
  iamRoleStatements:
    - Effect: Allow
      Action:
        - dynamodb:DescribeTable
        - dynamodb:Query
        - dynamodb:Scan
        - dynamodb:GetItem
        - dynamodb:PutItem
        - dynamodb:UpdateItem
        - dynamodb:DeleteItem
      Resource:
        - 'Fn::GetAtt': [Table, Arn]
  environment:
    tableName: \${self:custom.dynamodbTableName}

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
  create:
    handler: create.main
    events:
      - http:
          method: post
          path: items
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
  list:
    handler: list.main
    events:
      - http:
          method: get
          path: items
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
  get:
    handler: get.main
    events:
      - http:
          method: get
          path: items/{id}
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
  update:
    handler: update.main
    events:
      - http:
          method: put
          path: items/{id}
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
  delete:
    handler: delete.main
    events:
      - http:
          method: delete
          path: items/{id}
          cors: true
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
`;

// eslint-disable-next-line no-template-curly-in-string
const STACK_NAME_WITH_OPT = "test-${opt:testArg1}";
const STACK_NAME_WITHOUT_OPT = "test-backend";
const CMD_VAR_1 = "--testArg1";
const CMD_VAL_1 = "backend";
const CMD_VAR_2 = "-testArg2";
const CMD_VAL_2 = "arg2";
const INVALID_ARGUMENT_EXIT_CODE = 9;

jest.mock("fs");

describe("Serverless Config Options", () => {
  /*
   * Transform Args
   */
  it("should transform 1 arg (double dash) to dict", () => {
    const args = [CMD_VAR_1, CMD_VAL_1];
    const result = { testArg1: CMD_VAL_1 };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  it("should transform 1 arg (single dash) to dict", () => {
    const args = [CMD_VAR_2, CMD_VAL_2];
    const result = { testArg2: CMD_VAL_2 };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  it("should not remove dashes from middle of option in service name", () => {
    const args = ["--env-name", CMD_VAL_1];
    const result = { "env-name": CMD_VAL_1 };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  it("should transform multiple args (mixed dash) to dict", () => {
    const args = [CMD_VAR_1, CMD_VAL_1, CMD_VAR_2, CMD_VAL_2];
    const result = {
      testArg1: CMD_VAL_1,
      testArg2: CMD_VAL_2,
    };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  /*
   * Replace service.name Opt
   */
  it("should replace the service name option with stored option", () => {
    const testOptions = { testArg1: CMD_VAL_1 };
    expect(replaceStacknameOpt(STACK_NAME_WITH_OPT, testOptions)).toBe(
      STACK_NAME_WITHOUT_OPT
    );
  });

  it("should not replace the stack name where there is not opt variable in the YAML configuration file", () => {
    const testOptions = { testArg1: CMD_VAL_1 };
    expect(replaceStacknameOpt(STACK_NAME_WITHOUT_OPT, testOptions)).toBe(
      STACK_NAME_WITHOUT_OPT
    );
  });

  it("should output an error message when an opt varibale exists in serverless configuration but no option is passed", () => {
    console.error = jest.fn();
    process.exit = jest.fn();
    replaceStacknameOpt(STACK_NAME_WITH_OPT, []);

    expect(console.error).toHaveBeenCalledWith(
      CYAN_STRING_FORMAT,
      `Your project requires stack name option ${CMD_VAR_1} to be passed when starting sls-dev-tools`
    );
    expect(process.exit).toHaveBeenCalledWith(INVALID_ARGUMENT_EXIT_CODE);
  });
});

describe("Serverless Config Parsing", () => {
  let SLS;

  beforeAll(() => {
    fs.readFileSync.mockReturnValue(TEST_YAML_FILE);
    fs.existsSync.mockReturnValue(true);

    const program = {
      args: [CMD_VAR_1, CMD_VAL_1],
      location: "~/Dev/testProject/backend",
    };

    SLS = new ServerlessConfigParser(program);
  });

  it("should read YAML file and replace opt in service.name with stored arg", () => {
    expect(SLS.getStackName("dev")).toBe("test-backend-dev");
  });

  it("should get a stackname given a stage", () => {
    const stage = "test";
    expect(SLS.getStackName(stage)).toBe("test-backend-test");
  });
});
