const blessed = require("blessed");

class Box extends blessed.box {
    constructor(parent, width, height, content) {
        super({
            parent,
            width,
            height,
            left: 'right',
            top: 'center',
            align: 'center',
            padding: { left: 2, right: 2 },
            border: 'line',
            style: { fg: 'green', border: { fg: 'green' } },
            content,
        })
    }
}

module.exports = {
    Box,
};