import React from 'react';
import Main from './index';

const slsDevTools = new Main();

describe('Lambda Deployment', () => {
  it('should get the correct lambda name', () => {
    console.log(slsDevTools);
  });
});
