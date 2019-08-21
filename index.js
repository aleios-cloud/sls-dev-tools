import React, { Component } from 'react';
import AWS from 'aws-sdk';
import {render, Color, Box} from 'ink';
import Spinner from 'ink-spinner';

const stackName = "example stack"


const logo = `
___                      _             ___            _____         _    
/ __| ___ _ ___ _____ _ _| |___ ______ |   \ _____ __ |_   _|__  ___| |___
\\__ \\/ -_) '_\\ V / -_) '_| / -_|_-<_-< | |) / -_) V /   | |/ _ \\/ _ \\ (_-<
|___/\\___|_|  \\_/\\___|_| |_\\___/__/__/ |___/\\___|\\_/    |_|\\___/\\___/_/__/
																		   

`

class Demo extends Component {
	constructor(props) {
		super(props);
		this.state = { funcs: [], logGroups: [] };
	}

	componentDidMount() {
		this.cloudformation = new AWS.CloudFormation({ region: 'eu-west-2'});
		this.cloudwatchLogs = new AWS.CloudWatchLogs({ region: 'eu-west-2'});
		this.getLambdasForStackName(stackName);
		this.getLogs(stackName)
	}

	getLambdasForStackName(stackName) {
		const that = this;
		return this.cloudformation.listStackResources({ StackName : stackName }, function(err, data) {
			if (err) {
				console.log(err, err.stack);
			}
			else {
				that.setState({
					funcs: data.StackResourceSummaries.filter(res => res.ResourceType === "AWS::Lambda::Function"),
				})
			}
		});
	}

	getLogs(stackName) {
		const that = this;
		var params = {
			logGroupNamePrefix: `/aws/lambda/${stackName}`,
		};
		  that.cloudwatchLogs.describeLogGroups(params, function(err, data) {
			if (err) {
				console.log(err, err.stack);
			}
			else {
				that.setState({logGroups: data.logGroups})
			}
		  });
	}

	render() {
		return (
			<>
				<Color green>
					{logo}
				</Color>
				--- Functions ---
					{this.state.funcs.map(func => (
						<div style={{display: "flex", flexDirection: "row"}} key={func.PhysicalResourceId}>
							<div>{"\u03BB "}</div>
							<div>{func.LogicalResourceId}</div>
						</div>
					))}
				{""}
				--- Log Group ----
					{this.state.logGroups.map(logGroup => (
						<div style={{display: "flex", flexDirection: "row"}} key={logGroup.arn}>
								<>
									<Color green><Spinner type="dots"/></Color>
								</>
							<div>{`  ${logGroup.logGroupName}`}</div>
						</div>
					))}
			</>
		)
	}
};

render(<Demo/>);
