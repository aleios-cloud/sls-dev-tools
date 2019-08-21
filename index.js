import React, { Component } from 'react';
import AWS from 'aws-sdk';
import {render, Box, Static, TestResults} from 'ink';

const funcs = [
	{ title: "function 1", id: 1},
	{ title: "function 2", id: 2},
	{ title: "function 3", id: 3},
]

class Demo extends Component {
	constructor(props) {
		super(props);
		this.state = { funcs: [] };
	}

	componentDidMount() {
		this.cloudformation = new AWS.CloudFormation({ region: 'eu-west-2'});
		this.getLambdasForStackName("cerebro-corazon-staging-dev");
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

	render() {
		return (
			<>
				<Static>
					{this.state.funcs.map(func => (
						<div style={{display: "flex", flexDirection: "row"}} key={func.PhysicalResourceId}>
							<div>{"\u03BB "}</div>
							<div>{func.LogicalResourceId}</div>
						</div>
					))}
				</Static>
			</>
		)
	}
};

render(<Demo/>);
