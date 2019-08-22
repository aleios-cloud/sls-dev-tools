// credit https://github.com/jdeniau/changelog-view/blob/master/src/component/FullWidthSeparator.js
import React from 'react';
import { Box, StdoutContext, Color } from 'ink';

function FullWidthSeparator() {
  return (
    <Color green>
        <StdoutContext.Consumer>
        {({ stdout }) => (
            <Box>{new Array(stdout.columns).fill('─').join('')}</Box>
            )}
        </StdoutContext.Consumer>
    </Color>
  );
}

export default FullWidthSeparator;