import React from 'react';
import {render, Box, Static, TestResults} from 'ink';

const funcs = [
	{ title: "function 1", id: 1},
	{ title: "function 2", id: 2},
	{ title: "function 3", id: 3},
]

const Demo = () => (
<>
	<Static>
		{funcs.map(func => (
			func.title
		))}
	</Static>
</>
);

render(<Demo/>);
