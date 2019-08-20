#!/bin/bash

echo 'ℹ️  Lambda set up ℹ️'
echo ''

echo '❓  Name of Lambda? ❓'

read lambdaName

sed -i.bak "s/LAMBDA\_NAME/$lambdaName/g" serverless.yml package.json && 
    rm serverless.yml.bak package.json.bak

echo ''
echo '❓  Would you like to add a layer?(y/n) ❓'
read addLayer
echo ''

if [ $addLayer == 'y' ]
then
    ./addLayer.sh
else
    echo 'ℹ️  You can add a layer later using addLayer.sh ℹ️Y'
fi