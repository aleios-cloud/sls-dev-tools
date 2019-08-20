# Serverless Lambda Template with optional Layer support

This repo is derived from [AnomalyInnovations/serverless-nodejs-starter](https://github.com/AnomalyInnovations/serverless-nodejs-starter)

It provides the set up to create an AWS lambda with serverless using babel 7 that is set up to use layers

- jest, eslint and prettier configured

You can create a layer via https://github.com/robcronin/serverless-layer-template

For an example repo of a lambda with a layer created with these templates see [here](https://github.com/robcronin/lambda-with-layer-example)

## Requirements

- [Install the Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/installation/)
- [Configure your AWS CLI](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

## Install

```
sls install --url https://github.com/robcronin/serverless-lambda-with-optional-layer-template --name [NAME_OF_YOUR_LAMBDA]
```

or

```
git clone https://github.com/robcronin/serverless-lambda-with-optional-layer-template
```

- `cd [NAME_OF_YOUR_LAMBDA]`
- `yarn`
- `./setUp.sh` - answer the prompts

## Modify

Edit the code in `handler.js` as required

By default it is a simple hello function

## Deploy

- `yarn deploy`
  - This will run `sls deploy` assuming your aws credentials are set up

## Local usage

- Running `sls offline start` will allow you to ping `localhost:3000/hello`

## Tests

`yarn test` will run:

- `yarn lint`
- `yarn jest`

## Adding a layer

- If you created a layer with https://github.com/robcronin/serverless-layer-template you can use `./addLayer.sh` to set up your lambda to use it
- In your layer repo you can use `./local.sh` to create a local version of your lambda at `/opt` or use `yarn watch` to watch any changes and update your local version as you develop your layer
