#!/bin/bash

echo 'ℹ️  This script will do the setup of a layer created via https://github.com/robcronin/serverless-layer-template ℹ️'
echo 'ℹ️  i.e. will work if the layer code is contained in /opt/[LAYER_NAME] ℹ️'
echo ''
echo ''

echo '❓  ARN of Layer? ❓'
read layerArn

layerName="$(echo $layerArn | cut -d':' -f7)"


echo ''
echo 'ℹ️  Adding path to webpack.config.js ℹ️'
sed -i.bak "s/nodeExternals()/nodeExternals(), '\/opt\/$layerName'/" webpack.config.js && rm webpack.config.js.bak
echo ''

serverlessLine="$(grep -n 'layers' serverless.yml | cut -f1 -d:)"

echo "ℹ️  You can now import from /opt/$layerName ℹ️"
echo "ℹ️  To use this locally run local.sh in https://github.com/robcronin/serverless-layer-template ℹ️"
echo "🚨  Uncomment and add you arn to the layers section of serverless.yml (line $serverlessLine) 🚨"