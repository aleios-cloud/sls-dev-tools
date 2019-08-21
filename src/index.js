import React, { Component } from 'react';
import AWS from 'aws-sdk';
import { render, Color, Box } from 'ink';

import LogGroup from './components/LogGroup.js';
import FullWidthSeparator from './components/Seperator.js';

const stackName = process.env.STACK_NAME;

const logo = `
___                      _             ___            _____         _    
/ __| ___ _ ___ _____ _ _| |___ ______ |   \ _____ __ |_   _|__  ___| |___
\\__ \\/ -_) '_\\ V / -_) '_| / -_|_-<_-< | |) / -_) V /   | |/ _ \\/ _ \\ (_-<
|___/\\___|_|  \\_/\\___|_| |_\\___/__/__/ |___/\\___|\\_/    |_|\\___/\\___/_/__/
																		   

`;

class Demo extends Component {
  constructor(props) {
    super(props);
    this.state = { funcs: [], logGroups: [], logs: {} };
  }

  componentDidMount() {
    this.cloudformation = new AWS.CloudFormation({ region: 'eu-west-2' });
    this.cloudwatchLogs = new AWS.CloudWatchLogs({ region: 'eu-west-2' });
    this.getLambdasForStackName(stackName);
    this.getLogGroups(stackName);
  }

  getLambdasForStackName(stackName) {
    return this.cloudformation.listStackResources(
      { StackName: stackName },
      (err, data) => {
        if (err) {
          console.log(err, err.stack);
        } else {
          this.setState({
            funcs: data.StackResourceSummaries.filter(
              res => res.ResourceType === 'AWS::Lambda::Function',
            ),
          });
        }
      },
    );
  }

  getLogGroups(stackName) {
    var params = {
      logGroupNamePrefix: `/aws/lambda/${stackName}`,
    };
    this.cloudwatchLogs.describeLogGroups(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
      } else {
        this.setState({ logGroups: data.logGroups });
        this.getLogEvents(data.logGroups);
        this.interval = setInterval(() => {
          this.getLogEvents(data.logGroups);
        }, 5000);
      }
    });
  }

  getLogEvents(logGroups) {
    const logs = {}
    logGroups.forEach(group => {
      var params = {
        logGroupName: group.logGroupName,
        limit: 10,
      };
      this.cloudwatchLogs.filterLogEvents(params, (err, data) => {
        if (err) {
          console.log(err, err.stack);
        } else {
          logs[group.arn] = data.events;
        }
      });
    });
    this.setState({ logs })
  }

  render() {
    return (
      <>
        <Color green>{logo}</Color>
        --- Functions ---
        {this.state.funcs.map(func => (
          <div
            style={{ display: 'flex', flexDirection: 'row' }}
            key={func.PhysicalResourceId}
          >
            <div>{'\u03BB '}</div>
            <div>{func.LogicalResourceId}</div>
          </div>
        ))}
        {''}
          <FullWidthSeparator />
            <Box flexGrow={1} alignItems="center" justifyContent="center" >
              <div>Logs</div>
            </Box>
          <FullWidthSeparator />
        --- Log Group ----
        {this.state.logGroups.map(logGroup => (
          <LogGroup logGroup={logGroup} key={logGroup.arn} />
        ))}
      </>
    );
  }
}

render(<Demo />);
