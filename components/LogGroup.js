import React, { Component } from 'react';
import { render, Color } from 'ink';
import Spinner from 'ink-spinner';

export default class LogGroup extends Component {
  render() {
    return (
      <>
        {this.props.logGroup && (
          <div
            style={{ display: 'flex', flexDirection: 'row' }}
            key={this.props.logGroup.arn}
          >
            <>
              <Color green>
                <Spinner type="dots" />
              </Color>
            </>
            <div>{`  ${this.props.logGroup.logGroupName}`}</div>
          </div>
        )}
      </>
    );
  }
}
